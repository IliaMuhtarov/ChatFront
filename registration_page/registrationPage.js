const validationErrorMessage = document.getElementById("validationErrorMessage");
const userAlreadyExistsErrorMessage = document.getElementById("userAlreadyExistsErrorMessage");
const registerButton = document.getElementById("registerButton");
const nameInput = document.getElementById("nameInput");
const loginInput = document.getElementById("loginInput");
const passwordInput = document.getElementById("passwordInput");
const successMessage = document.getElementById("successMessage");
const backButton = document.getElementById("backButton");
const URL = "http://localhost:8080/register";
const Http = new XMLHttpRequest();


backButton.addEventListener("click", function(){
    window.location.href="../index.html";
});

registerButton.addEventListener("click", function(){
    successMessage.style.display = "none";
    let login = loginInput.value.trim();
    let name = nameInput.value.trim();
    let password = passwordInput.value.trim();
    if(login == "" || password == "" || name == ""){
        validationErrorMessage.style.display = "block";
    } else{
        Http.open("POST", URL);
        Http.setRequestHeader("Content-Type", "application/json");
        let body = JSON.stringify({
            login: login,
            password: password,
            userName: name
        });
        Http.send(body);
    }
});

Http.onreadystatechange = function(){
    if(this.status == 201){
        successMessage.style.display = "block";
    } else if(this.status == 409){
        userAlreadyExistsErrorMessage.style.display = "block";
    }
};


loginInput.addEventListener("input", function(){
    validationErrorMessage.style.display = "none";
    userAlreadyExistsErrorMessage.style.display = "none";
    successMessage.style.display = "none";
});

passwordInput.addEventListener("input", function(){
    validationErrorMessage.style.display = "none";
    successMessage.style.display = "none";
});


nameInput.addEventListener("input", function(){
    validationErrorMessage.style.display = "none";
    successMessage.style.display = "none";
});