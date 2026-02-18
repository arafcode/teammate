document.addEventListener('DOMContentLoaded', () => {
    console.log('Create Listing Script Loaded');
    // alert('Debug: Script Yüklendi'); // Uncomment if needed

    // Auth Check
    if (typeof Auth !== 'undefined' && !Auth.isAuthenticated()) {
        window.location.href = 'login.html?redirect=create-listing.html';
        return;
    }

    const form = document.getElementById('create-listing-form');
    if (!form) {
        alert('HATA: Form bulunamadı!');
        return;
    }

    const categoryInputs = document.querySelectorAll('input[name="category_slug"]');
    const subcategorySelect = document.getElementById('subcategory');
    const locationField = document.getElementById('location-field');
    const btnSubmit = document.getElementById('btn-submit');

    // Subcategories Configuration
    const subcategories = {
        'virtual': ['League of Legends', 'Valorant', 'CS2', 'Dota 2', 'Minecraft', 'Overwatch 2', 'Deadlock', 'Diğer'],
        'real_life': ['Halı Saha', 'Basketbol', 'Bisiklet', 'Koşu', 'Tenis', 'Doğa Yürüyüşü', 'Kamp', 'Diğer']
    };

    function updateSubcategories() {
        // Safe check for elements
        const selectedInput = document.querySelector('input[name="category_slug"]:checked');
        if (!selectedInput) return;

        const selectedCategory = selectedInput.value;
        const options = subcategories[selectedCategory] || [];

        if (subcategorySelect) {
            subcategorySelect.innerHTML = options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
        }

        // Location Logic
        if (locationField) {
            if (selectedCategory === 'real_life') {
                locationField.classList.remove('hidden');
                document.getElementById('location')?.setAttribute('required', 'true');
            } else {
                locationField.classList.add('hidden');
                document.getElementById('location')?.removeAttribute('required');
                const locInput = document.getElementById('location');
                if (locInput) locInput.value = '';
            }
        }
    }

    // Initialize
    updateSubcategories();
    window.updateSubcategories = updateSubcategories; // Make global for onchange

    // Form Submission
    // Toast Function (Duplicated from main.js to avoid dependency hell)
    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        // Icon based on type
        let icon = '';
        if (type === 'success') icon = '<svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
        else if (type === 'error') icon = '<svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
        else icon = '<svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';

        toast.innerHTML = `${icon}<span>${message}</span>`;

        container.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('hiding');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 3000);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Form submitted event triggered');

        // Disable button
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Yayınlanıyor...';
        }

        try {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Parse duration
            const durationMinutes = parseInt(data.duration);
            data.duration_minutes = durationMinutes;

            // Use current time as activity_date for "instant" listings
            const now = new Date();
            data.activity_date = now.toISOString();

            // Token check
            const token = Auth.getToken();
            if (!token) {
                showToast('HATA: Giriş yapılmamış. Lütfen tekrar giriş yapın.', 'error');
                setTimeout(() => window.location.href = 'login.html', 2000);
                return;
            }

            console.log('Sending data:', data);

            const response = await fetch(`${API_URL}/listings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            console.log('Response status:', response.status);

            const result = await response.json();
            console.log('Response result:', result);

            if (response.ok) {
                // Success
                showToast('İlan başarıyla oluşturuldu! Yönlendiriliyorsunuz...', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500); // 1.5s delay for user to see the toast
            } else {
                // Error
                console.error('Server Error:', result);
                let errorMsg = 'Hata: ' + (result.message || 'Bilinmeyen hata');
                if (result.errors) {
                    errorMsg += ' (Detaylar konsolda)';
                }
                showToast(errorMsg, 'error');

                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.textContent = 'İlanı Yayınla';
                }
            }
        } catch (error) {
            console.error('Catch Error:', error);
            showToast('Bir hata oluştu: ' + error.message, 'error');
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.textContent = 'İlanı Yayınla';
            }
        }
    });
});
