/*
  Put the public URL of your ZCORP Telegram/API server here.

  Example:
  https://your-panel-api.example.com
*/

const API_URL =
  "https://YOUR-PANEL-API-DOMAIN.example.com";


const $ = id =>
  document.getElementById(id);


let started = Date.now();


$("loginBtn").onclick = async () => {

  const username =
    $("username").value.trim();

  const password =
    $("password").value;

  $("err").textContent = "";


  if (!username || !password) {

    $("err").textContent =
      "Enter username and password.";

    return;
  }


  if (API_URL.includes("YOUR-PANEL")) {

    $("err").textContent =
      "Set API_URL in main.js first.";

    return;
  }


  try {

    const response =
      await fetch(
        API_URL + "/api/login",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            username,
            password
          })
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Login failed"
      );

    }


    localStorage.setItem(
      "zcorp_token",
      data.token
    );


    show(data.user);

  } catch (error) {

    $("err").textContent =
      error.message;

  }

};


function show(user) {

  $("loginPage")
    .classList
    .add("hidden");


  $("panel")
    .classList
    .remove("hidden");


  $("userTop").textContent =
    "@" + user.username;


  $("disk").textContent =
    (user.diskMB || 0) + " MB";


  $("console").innerHTML +=
    `<div>✓ Logged in as ${
      user.username.replace(/[<>]/g, "")
    }.</div>`;
}


$("cmd").addEventListener(
  "keydown",
  event => {

    if (event.key !== "Enter")
      return;


    const value =
      event.target.value.trim();


    if (!value)
      return;


    const consoleBox =
      $("console");


    consoleBox.innerHTML +=
      `<div>$ ${
        value.replace(/[<>]/g, "")
      }</div>`;


    consoleBox.innerHTML +=
      `<div>
        Command interface ready.
      </div>`;


    event.target.value = "";


    consoleBox.scrollTop =
      consoleBox.scrollHeight;

  }
);


setInterval(() => {

  const seconds =
    Math.floor(
      (Date.now() - started) / 1000
    );


  $("uptime").textContent =
    Math.floor(seconds / 3600) +
    "h " +
    Math.floor(
      (seconds % 3600) / 60
    ) +
    "m " +
    (seconds % 60) +
    "s";

}, 1000);
