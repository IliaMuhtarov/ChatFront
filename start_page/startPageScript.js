const loginButton = document.getElementById("loginButton");
const loginInput = document.getElementById("loginInput");
const passwordInput = document.getElementById("passwordInput");
const registerButton = document.getElementById("registerButton");
const errorMessage = document.getElementById("errorMessage");
const URL = "http://localhost:8080/login";
const Http = new XMLHttpRequest();

registerButton.addEventListener("click", function () {
  window.location.href = "../registration_page/registrationPage.html";
});

loginInput.addEventListener("input", function () {
  errorMessage.style.display = "none";
});

passwordInput.addEventListener("input", function () {
  errorMessage.style.display = "none";
});

loginButton.addEventListener("click", function () {
  Http.open(
    "GET",
    URL +
      "?login=" +
      loginInput.value.trim() +
      "&password=" +
      passwordInput.value.trim()
  );
  Http.send();
});

Http.onreadystatechange = function () {
  if (this.status == 200 && this.readyState == 4) {
    let userData = JSON.parse(Http.responseText);
    sessionStorage.setItem("userLogin", userData.login);
    sessionStorage.setItem("userName", userData.name);
    window.location.href = "../chat_page/chatPage.html";
  } else if (this.status == 404) {
    errorMessage.style.display = "block";
  }
};
