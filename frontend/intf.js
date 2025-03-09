const banner = document.getElementById('banner');
const data = document.getElementById('dycontent');

// let spcart = []; *deprecated as spcart will be integrated to sessionStorage along with curcat
/*const datadisplay = { //deprecated
    index: {
        banner: `<div id="banner">
            Welcome to IPC Shop! You are at: About
            <a href="checkout.html">
                <img class="cart" src="spc.jpg"></img>
            </a>
        </div>`,
        content: `<section class="viewitem">
            <div class="shopping-list" id="shoppingList">
                <h3>Shopping List (Hover For Details)</h3>
                <ul id="cartItems"></ul>
                <div class="total-price">Total: $<span id="totalPrice">0.00</span></div>
            </div>
            <h4>Select a category to browse for goods.</h4>
            <br>
            Click add to cart button to add your item to your cart, hover over your shopping cart icon to see your current shopping cart.
            <br>
            Important Note: This whole webpage is for the course IERG4210 offered by CUHK @2025 spring semester as project submission, do NOT expect to be able to make legit purchase, in case that's what you are thinking to achieve, for whatever reason it is.
        </section>`
    },
    Util: {
        banner: `<div id="banner">
            Welcome to IPC Shop! You are at: Utility
            <a href="checkout.html">
                <img class="cart" src="spc.jpg"></img>
            </a>
        </div>`,
        content: `
            <div class="shopping-list" id="shoppingList">
                <h3>Shopping List (Hover For Details)</h3>
                <ul id="cartItems"></ul>
                <div class="total-price">Total: $<span id="totalPrice">0.00</span></div>
            </div>
            <div class="gdcontainer">
                <div class="goods">
                    <a href="res/products/hertadollfigure.html"><h2>Herta Doll Figure</h2></a>
                    <a href="res/products/hertadollfigure.html"><img src="res/pics/hdf.png"></a>
                    <p>$20000</p>
                    <button onclick="addcart('Herta Doll Figure', 20000)">Add to Cart</button>
                </div>
                <div class="goods">
                    <a href="res/products/bigherta.html"><h2>Big Herta</h2></a>
                    <a href="res/products/bigherta.html"><img src="res/pics/beautifulaf.png"></a>
                    <p>$20000000000</p>
                    <button onclick="addcart('Big Herta', 20000000000)">Add to Cart</button>
                </div>
                <div class="goods">
                    <a href="res/products/lordlytrashcan.html"><h2>Lordly Trashcan</h2></a>
                    <a href="res/products/lordlytrashcan.html"><img src="res/pics/ltc.png"></a>
                    <p>$20</p>
                    <button onclick="addcart('Lordly Trashcan', 20)">Add to Cart</button>
                </div>
                <div class="goods">
                    <a href="res/products/dominicus.html"><h2>Dominicus</h2></a>
                    <a href="res/products/dominicus.html"><img src="res/pics/chickenwingpro.png"></a>
                    <p>$20000</p>
                    <button onclick="addcart('Dominicus', 20000)">Add to Cart</button>
                </div>
                <div class="goods">
                    <a href="res/products/sparkledoll.html"><h2>Sparkle's Doll</h2></a>
                    <a href="res/products/sparkledoll.html"><img src="res/pics/explosion.jpg"></a>
                    <p>$19</p>
                    <button onclick="addcart('Sparkle Doll', 19)">Add to Cart</button>
                </div>
            </div>`
    },
    Vehi: {
        banner: `<div id="banner">
            Welcome to IPC Shop! You are at: Vehicles
            <a href="checkout.html">
                <img class="cart" src="spc.jpg"></img>
            </a>
        </div>`,
        content: `
            <div class="shopping-list" id="shoppingList">
                <h3>Shopping List (Hover For Details)</h3>
                <ul id="cartItems"></ul>
                <div class="total-price">Total: $<span id="totalPrice">0.00</span></div>
            </div>
            <div class="gdcontainer">
                <div class="goods">
                    <a href="res/products/hertaspacestation.html"><h2>Herta's Space Station</h2></a>
                    <a href="res/products/hertaspacestation.html"><img src="res/pics/hss.webp"></a>
                    <p>$999999</p>
                    <button onclick="addcart('Herta Space Station', 999999)">Add to Cart</button>
                </div>
                <div class="goods">
                    <a href="res/products/tulongbaodao.html"><h2>TuLongBaoDao</h2></a>
                    <a href="res/products/tulongbaodao.html"><img src="res/pics/1sec1knife999.png"></a>
                    <p>$1</p>
                    <button onclick="addcart('Tulongbaodao', 1)">Add to Cart</button>
                </div>
                <div class="goods">
                    <a href="res/products/hyperion.html"><h2>Hyperion</h2></a>
                    <a href="res/products/hyperion.html"><img src="res/pics/hpr.webp"></a>
                    <p>$3000000</p>
                    <button onclick="addcart('Hyperion', 3000000)">Add to Cart</button>
                </div>
            </div>`
    }
};
*/
function onSet(item, value){
    sessionStorage.setItem(item, value);
}

function spcartstring() { //stay, shopping cart
    sessionStorage.setItem('spcart', JSON.stringify(spcart)); // turn spcart into string and store to sessionStorage
}

function spinit() { //stay, shopping cart
    const temp = sessionStorage.getItem('spcart'); // initialize spcart, blank one will be inited if there is nothing in sessionStorage (DOMContentLoaded)
    if (temp != null) {
        spcart = JSON.parse(temp);
    } else {
        spcart = [];
    }
}

/*document.addEventListener('DOMContentLoaded', () => { //Curcat stays, modify to grab data from server
    const curcat = sessionStorage.getItem('curcat');
    if (curcat && datadisplay[curcat]) { // when curcat is used
        banner.innerHTML = datadisplay[curcat].banner;
        data.innerHTML = datadisplay[curcat].content;
    } else {
        banner.innerHTML = datadisplay.index.banner;
        data.innerHTML = datadisplay.index.content;
    }
    spinit();
    renderlist(); // load spcart and render for init
}); */
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
                link.href = "product.html";
                link.setAttribute('cg' ,cat.catid);
                link.textContent = cat.name;
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    onSet('curcat', cat.catid);
                    prodPopulate(cat.catid, cat.name);
            });
            sidePanelInit.appendChild(link); 
            }
            else{
                const link = document.createElement('a');
                link.href = "product.html";
                link.setAttribute('cg' ,cat.catid);
                link.textContent = cat.name;
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    onSet('curcat', cat.catid);
                    prodPopulate(cat.catid, cat.name);
            });
            sidePanelInit.appendChild(link);
        }
        });

    } catch (err) {
    console.error("cfe - 19654");
    //console.error(err);
    }
}
async function prodPopulate(catid, name) {
    try{
        if(catid == 0) {
            banner.innerHTML = `<div id="banner">Welcome to IPC Shop! You are browsing: Category <a href="checkout.html"><img class="cart" src="spc.jpg"></a></div>`
            data.innerHTML = `<section class="viewitem">
            <div class="shopping-list" id="shoppingList">
                <h3>Shopping List (Hover For Details)</h3>
                <ul id="cartItems"></ul>
                <div class="total-price">Total: $<span id="totalPrice">0.00</span></div>
            </div>
            <h4>Select a category to browse for goods.</h4>
            <br>
            Click add to cart button to add your item to your cart, hover over your shopping cart icon to see your current shopping cart.
            <br>
            Important Note: This whole webpage is for the course IERG4210 offered by CUHK @2025 spring semester as project submission, do NOT expect to be able to make legit purchase, in case that's what you are thinking to achieve, for whatever reason it is.
        </section>`;
        spinit();
        renderlist();
        }
        else {
        const rp = await fetch(`/api/cat/products/${catid}`);
	    const reply = await rp.json();
        const products = reply.products;
	    //console.log(products);
            //console.log(rp);
	   // console.log(reply);
            banner.innerHTML = `<div id="banner">Welcome to IPC Shop! You are browsing: Category <a href="checkout.html"><img class="cart" src="spc.jpg"></a></div>`
            data.innerHTML = `<section class="viewitem">
            <div class="shopping-list" id="shoppingList">
                <h3>Shopping List (Hover For Details)</h3>
                <ul id="cartItems"></ul>
                <div class="total-price">Total: $<span id="totalPrice">0.00</span></div>
            </div>`;

            let prodDet = '<div class="gdcontainer">';
            products.forEach((prod) => {
                prodDet += `
                <div class="goods">
                    <a href="product.html" onclick ="onSet('prodid', ${prod.pid})"><h2>${prod.name}</h2></a>
                    <a href="product.html" onclick ="onSet('prodid', ${prod.pid})"><img src="res/pics/${prod.pid}.jpg"></a>
                    <p>$${prod.price}</p>
                    <button onclick="addcart('${prod.name}', ${prod.price})">Add to Cart</button>
                </div>`;
        });
        prodDet += '</div>';
        data.innerHTML = data.innerHTML + prodDet;

        spinit();
        renderlist();
    }
    } catch (err) {
        console.error("ppe - 17468");
	//console.error(err);
    }
}

document.addEventListener('DOMContentLoaded', async () => { //async version
    const curcat = sessionStorage.getItem('curcat');
    if (!curcat) {
        sessionStorage.setItem('curcat', 0);
	curcat = 0;
    }
    const rp = await fetch('/api/categories/curcat'); 
    const reply = await rp.json();
    const iddcat = reply.categories;
    await categoryFetch();
    await prodPopulate(curcat, iddcat.name);

    spinit();
    renderlist(); // load spcart and render for init
});


/*document.querySelectorAll('a[pid]').forEach(link => { // dynamic content based on clicked product
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const pid = e.target.getAttribute('pid');
        let curpid = sessionStorage.setItem('prodid', pid);
        window.location.href = e.target.href;
    });
});*/



/*document.querySelectorAll('.catdis a').forEach(link => { // dynamic content based on clicked category
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const cat = e.target.getAttribute('cat');
        
        if (datadisplay[cat]) {
            sessionStorage.setItem('curcat', cat); // set curcat as well just in case its wrong
            banner.innerHTML = datadisplay[cat].banner;
            data.innerHTML = datadisplay[cat].content;
        }
        spinit();
        renderlist(); // load spcart and render for init
    });
});
*/

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
        const parsedqty = parseInt(item.qty, 10); // Broke the summed $$ if not parsed before actualizing, sigh

        const listItem = document.createElement('li'); // list for each item, give name, price and box for input
        listItem.innerHTML = `
            <span>${item.name}</span>
            <span>$${parsedprice.toFixed(2)}</span>
            <input type="number" min="1" max="5" value="${parsedqty}" onchange="updateqty(${index}, this.value)">
            <span>$${(parsedprice * parsedqty).toFixed(2)}</span>
            <button onclick="deleteItem(${index})">X</button>
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

/*window.addEventListener('beforeunload', function(e){
    if(leave){
        e.preventDefault();
    }
    leave = true;
}); //Deprecated code block for exit alert: Unable in customizing msg and lack in exp in js thus unable to alert only when closing tab
*/

//Edit1: Code regards to shopping list will be copied to prod.js, i hope this works
