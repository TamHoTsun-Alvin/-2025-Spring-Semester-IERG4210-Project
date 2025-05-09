document.addEventListener("DOMContentLoaded", async () => {
    try {
      const rp = await fetch('/authv1/test/', {
        method: 'GET',
        credentials: 'include'  
      });
      
      if (!rp.ok) {
        document.getElementById("testres").innerHTML = `rp not ok`;
        return;
      }
      
      // Get the response message from the server and display it
      const msg = await rp.text();
      document.getElementById("testres").innerText = msg;
    } catch (error) {
      console.error("Error during validation:", error);
      window.location.href = "/index.html";
    }
  });