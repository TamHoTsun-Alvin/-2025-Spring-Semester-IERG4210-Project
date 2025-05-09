document.addEventListener('DOMContentLoaded', async () => {
    const stripe = Stripe('pk_test_51RImWgIeuS6oLuC9prmIX0n429WAxtzp2gooHNuyHX1COWxpjn3rS3sG2UU1V8fMUjED6iMQYkVjSLujcc3tR8Xe00cc3qs7p9');
    const spcart = JSON.parse(sessionStorage.getItem('spcart')) || [];
    const user = sessionStorage.getItem('uname') || 'guest';
    renderCart(spcart);

    document.getElementById('checkout-button').addEventListener('click', async () => {
        if(spcart.length === 0) {
            showError('Your cart is empty');
            return;
        }

        try {
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: spcart,
                    user: user
                })
            });

            if(!response.ok) throw new Error('Server error');
            
            const { sessionId } = await response.json();
            
            const { error } = await stripe.redirectToCheckout({ sessionId });
            if(error) throw error;

            sessionStorage.removeItem('spcart');
        } catch (err) {
            showError(`Payment failed: ${err.message}`);
        }
    });

    function renderCart(items) {
        const container = document.getElementById('cart-summary');
        const totalElement = document.getElementById('total-price');
        
        container.innerHTML = items.map(item => `
            <div class="cart-item">
                <h3>${item.name}</h3>
                <p>Quantity: ${item.qty}</p>
                <p>Price: $${(item.price).toFixed(2)} each</p>
            </div>
        `).join('');

        const total = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
        totalElement.innerHTML = `<h2>Total: $${(total).toFixed(2)}</h2>`;
    }

    function showError(msg) {
        document.getElementById('error-message').textContent = msg;
    }
});