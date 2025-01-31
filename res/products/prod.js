function setcurcat(category) {
    sessionStorage.setItem('curcat', category);
}

function spcartstring() {
    sessionStorage.setItem('spcart', JSON.stringify(spcart)); // cp from intf.js as is
}

function spinit() {
    const temp = sessionStorage.getItem('spcart'); // cp from intf.js as is
    if (temp != null) {
        spcart = JSON.parse(temp);
    } else {
        spcart = [];
    }
}

document.addEventListener('DOMContentLoaded', () => { // Copied from intf.js, only cart related is retained as only action req on DOMLoaded is cart
    spinit();
    renderlist(); // load spcart and render for init
});

function addcart(product, price) { // if matching, +1 quantity, else push item to last of spcart
    const exist = spcart.find(item => item.name === product);
    if (exist) {
        exist.qty++;
    } else {
        spcart.push({ name: product, price: parseFloat(price), qty: 1 });
    }
    renderlist();
    spcartstring();
}

function renderlist() { // change HTML for expandable list
    const cartItems = document.getElementById('cartItems');
    const tpdisplay = document.getElementById('totalPrice');
    let total = 0;

    cartItems.innerHTML = ''; // rerender inner HTML

    spcart.forEach((item, index) => {
        const parsedprice = parseFloat(item.price);
        const parsedqty = parseInt(item.qty, 10); // Broke the summed $$ if not parsed before actulizing, sigh

        const listItem = document.createElement('li'); // list for each item, give name, price and box for input
        listItem.innerHTML = `
            <span>${item.name}</span>
            <span>$${parsedprice.toFixed(2)}</span>
            <input type="number" min="1" max="5" value="${parsedqty}" onchange="updateqty(${index}, this.value)">
            <span>$${(parsedprice * parsedqty).toFixed(2)}</span>
        `;
        cartItems.appendChild(listItem);

        total += parsedprice * parsedqty;
    });
    tpdisplay.textContent = total.toFixed(2);
}

function updateqty(index, newq) {
    const parsed = parseInt(newq);
    if (parsed >= 1) {
        spcart[index].qty = parsed;
        spcartstring();
        renderlist();
    }
}