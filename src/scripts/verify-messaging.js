const db = require('../config/db');
const User = require('../models/userModel');
const Message = require('../models/messageModel');
const Listing = require('../models/listingModel');

async function verifyMessaging() {
    try {
        console.log('--- Starting Messaging Verification (Full) ---');

        let user1Id, user2Id, catId, listingId;

        // 1. Create Users
        try {
            const suffix = Date.now();
            console.log('Creating User 1...');
            user1Id = await User.create({
                username: `msg_user1_${suffix}`,
                email: `msg1_${suffix}@test.com`,
                password_hash: 'hashedpassword123'
            });
            console.log('User 1 ID:', user1Id);

            console.log('Creating User 2...');
            user2Id = await User.create({
                username: `msg_user2_${suffix}`,
                email: `msg2_${suffix}@test.com`,
                password_hash: 'hashedpassword123'
            });
            console.log('User 2 ID:', user2Id);
        } catch (e) {
            console.error('FAILED to create Users:', e);
            throw e;
        }

        // 2. Get Category
        try {
            const [cats] = await db.execute("SELECT id FROM categories WHERE name = 'virtual'");
            if (cats.length === 0) throw new Error('Category virtual not found');
            catId = cats[0].id;
            console.log('Category ID:', catId);
        } catch (e) {
            console.error('FAILED to get Category:', e);
            throw e;
        }

        // 3. Create Listing
        try {
            console.log('Creating Listing...');
            listingId = await Listing.create({
                user_id: user1Id,
                category_id: catId,
                subcategory: 'Valorant',
                title: 'Test Listing for Msg',
                description: 'Test description',
                activity_date: new Date(),
                expiry_date: new Date(Date.now() + 3600000), // 1 hour
                max_participants: 5
            });
            console.log(`Listing created: ${listingId}`);
        } catch (e) {
            console.error('FAILED to create Listing:', e);
            throw e;
        }

        // 4. Send Message
        try {
            console.log('User 2 sending message to User 1...');
            const msgId = await Message.create({
                sender_id: user2Id,
                receiver_id: user1Id,
                listing_id: listingId,
                content: 'Hello, is this available?'
            });
            console.log(`Message sent: ${msgId}`);
        } catch (e) {
            console.error('FAILED to send Message:', e);
            throw e;
        }

        // 5. Check Conversations
        try {
            console.log('User 1 fetching conversations...');
            const conversations = await Message.getConversations(user1Id);
            console.log(`Conversations found: ${conversations.length}`);

            if (conversations.length !== 1) throw new Error('Expected 1 conversation');
            // Note: DB calls might not include suffix in other_user_name if joined correctly? 
            // Actually it joins users table, so it should be correct.

            // 6. Fetch Thread
            console.log('User 1 fetching thread...');
            const thread = await Message.getThread(user1Id, user2Id, listingId);
            console.log(`Thread messages: ${thread.length}`);
            if (thread.length !== 1) throw new Error('Expected 1 message in thread');
            if (thread[0].content !== 'Hello, is this available?') throw new Error('Wrong content');

            // 7. Mark as Read
            console.log('Marking as read...');
            await Message.markAsRead(user1Id, user2Id, listingId);

            // 8. Verify Read Status
            const conversationsAfterRead = await Message.getConversations(user1Id);
            if (conversationsAfterRead[0].is_read !== 1) throw new Error('Message should be read');

        } catch (e) {
            console.error('FAILED in Message Checks:', e);
            throw e;
        }

        console.log('--- Verification PASSED ---');
        process.exit(0);
    } catch (error) {
        console.error('--- Verification FAILED ---');
        console.error(error);
        process.exit(1);
    }
}

verifyMessaging();
