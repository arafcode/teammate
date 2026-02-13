document.addEventListener('DOMContentLoaded', () => {
    // Auth Check
    if (typeof Auth !== 'undefined' && !Auth.isAuthenticated()) {
        window.location.href = 'login.html?redirect=create-listing.html';
        return;
    }

    const form = document.getElementById('create-listing-form');
    const categoryInputs = document.querySelectorAll('input[name="category_slug"]');
    const locationField = document.getElementById('location-field');
    const btnSubmit = document.getElementById('btn-submit');

    // Toggle Location Field based on Category
    categoryInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            if (e.target.value === 'real_life') {
                locationField.classList.remove('hidden');
                document.getElementById('location').setAttribute('required', 'true');
            } else {
                locationField.classList.add('hidden');
                document.getElementById('location').removeAttribute('required');
                document.getElementById('location').value = '';
            }
        });
    });

    // Set Default Date (Now)
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('activity_date').value = now.toISOString().slice(0, 16);

    // Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Disable button
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Yayınlanıyor...';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Calculate Expiry Date (Default: Activity Date + 2 hours)
        const activityDate = new Date(data.activity_date);
        const expiryDate = new Date(activityDate.getTime() + 2 * 60 * 60 * 1000); // +2 Hours
        data.expiry_date = expiryDate.toISOString();

        try {
            const token = Auth.getToken();
            const response = await fetch(`${API_URL}/listings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                // Success
                window.location.href = 'index.html';
            } else {
                // Error
                alert(result.errors ? result.errors.map(e => e.msg).join('\n') : (result.message || 'Bir hata oluştu.'));
                btnSubmit.disabled = false;
                btnSubmit.textContent = 'İlanı Yayınla';
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Sunucu hatası oluştu.');
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'İlanı Yayınla';
        }
    });
});
