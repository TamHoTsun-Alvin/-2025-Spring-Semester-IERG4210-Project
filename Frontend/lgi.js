const inputArea = document.getElementById("lgi");

document.addEventListener("DOMContentLoaded", () => {
    inputArea.innerHTML = '';
    inputArea.innerHTML += `
    <h1>Login</h1>
    <form id = "loginform">
    UserName: <input type="text" id="entity" placeholder="Enter UserName"><br>
    Password: <input type="password" id="pw" placeholder="Enter Password"><br>
    <br>
    <button type="submit">Login</button>
    </form>`

    document.getElementById("loginform").addEventListener("submit", async (event) => {
        event.preventDefault();
        const creds = {
            entity: document.getElementById("entity").value,
            pw: document.getElementById("pw").value
        }
        
        try{
            const rp = await fetch('/authv1/lgi/', {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(creds)
        });
        
        
        if (!rp.ok) {
            console.log("LGERR_A");
        }
        
        const data = await rp.json();
        if(data.uname) {
            sessionStorage.setItem("uname", data.uname);
            window.location.href = "/index.html";
        }
        } catch (error) {
            console.log("LGERR_G");
            console.error('Error:', error);
        }
        
        });
        
});

