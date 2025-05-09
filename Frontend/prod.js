const banner = document.getElementById('banner');
const data = document.getElementById('pd');
const splist = `
<div class="shopping-list" id="shoppingList">
    <h3>Shopping List (Hover For Details)</h3>
    <ul id="cartItems"></ul>
    <div class="total-price">Total: $<span id="totalPrice">0.00</span></div>
</div>
`;
function onSet(item, value){
    sessionStorage.setItem(item, value);
}

document.addEventListener('DOMContentLoaded', async () => { //async version
    const curcat = sessionStorage.getItem('curcat');
    let pid = sessionStorage.getItem('prodid');
    if(!pid){
        onSet('prodid', 4350);
        pid = 4350;
    }
    if (!curcat) {
        onSet('curcat', 0);
        curcat = "0";
    }
    await categoryFetch();
    await contPopulate(pid, curcat);

    spinit();
    renderlist(); // load spcart and render for init
});

async function contPopulate(pid, curcat) {
    try{
    const rp = await fetch(`/api/products/${pid}`);
	const reply = await rp.json();
	const products = reply.product;
        //const products = await rp.json();
	
	const rp2 = await fetch(`/api/categories/${curcat}`);
	const reply2 = await rp2.json();
	const name = reply2.categories?.[0]?.name; // Returned an array instead, took some time to debug, use optional channig for safety
    console.error(name);
        banner.innerHTML = `<div id="banner">Welcome to IPC Shop! You are browsing: <a href = "/index.html" onclick = onSet('curcat', ${curcat})>${name}</a> < ${products.name} <a href="checkout.html"><img class="cart" src="spc.jpg"></a></div>`
        data.innerHTML = splist;

        let prodDet = '<div class="prodisplay">';
            prodDet += `
                <p><h4>${products.name}</h4></p>
                <p><img src="res/pics/${products.pid}.jpg"></p>
                <p>$${products.price}</p>
                ${products.des}
                <button onclick="addcart('${products.name}', ${products.price})">Add to Cart</button>`;
            prodDet += '</div>';
        data.innerHTML = data.innerHTML + prodDet;

        spinit();
        renderlist();
    } catch (err) {
        console.error("pde - 54619");
	console.error(err);
    }
}

async function categoryFetch() {
    try{
        const rp = await fetch('/api/categories');
	const reply = await rp.json();
        const categories = reply.categories;
        const sidePanelInit = document.querySelector('.catdis');
        sidePanelInit.innerHTML = ''; //init with nothing, append below

        categories.forEach((cat) => {
            if(cat.catid == 0) {
                const link = document.createElement('a');
                link.href = "/index.html";
                link.setAttribute('cg' ,cat.catid);
                link.textContent = cat.name;
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    sessionStorage.setItem('curcat', cat.catid);
                    window.location.href = 'index.html';
            });
            sidePanelInit.appendChild(link); 
            }
            else{
                const link = document.createElement('a');
                link.href = "/index.html";
                link.setAttribute('cg' ,cat.catid);
                link.textContent = cat.name;
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    sessionStorage.setItem('curcat', cat.catid);
                    window.location.href = 'index.html';
            });
            sidePanelInit.appendChild(link);
        }
        });

    } catch (err) {
    console.error("cfe - 19654");
    }
}

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
            <button onclick="deleteItem(${index})">Delete</button>
        `;
        cartItems.appendChild(listItem);

        total += parsedprice * parsedqty;
    });
    tpdisplay.textContent = total.toFixed(2);
}

function deleteItem(index) {
    spcart.splice(index, 1); 
    spcartstring(); 
    renderlist(); 
}

function updateqty(index, newq) {
    const parsed = parseInt(newq);
    if (parsed >= 1) {
        spcart[index].qty = parsed;
        spcartstring();
        renderlist();
    }
}
