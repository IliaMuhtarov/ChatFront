const userName = sessionStorage.getItem("userName");
const headerMessage = document.getElementById("headerMessage");
const URL = "http://localhost:8080/";
let currentUser;

headerMessage.innerHTML = "Вы вошли как " + userName;
let companionLogin;
let companionName;
let subscription;
let isCommonChat = false;
const userLogin = sessionStorage.getItem("userLogin");
const messageContainer = document.getElementById("messageContainer");
const sendMessageButton = document.getElementById("sendMessageButton");
const messageContentInput = document.getElementById("messageContentInput");
const companionNameHeader = document.getElementById("companionNameHeader");
const communication = document.getElementById("communication");

const onTimeContainerButton = document.getElementById("onTimeContainerButton");
const offTimeContainerButton = document.getElementById(
  "offTimeContainerButton"
);
const timeContainer = document.getElementById("timeContainer");
const startDatePicker = document.getElementById("startDatePicker");
startDatePicker.valueAsDate = new Date();
const endDatePicker = document.getElementById("endDatePicker");
endDatePicker.valueAsDate = new Date();
const searchButton = document.getElementById("searchButton");

onTimeContainerButton.addEventListener("click", function () {
  onTimeContainerButton.style.display = "none";
  timeContainer.style.display = "flex";
});
offTimeContainerButton.addEventListener("click", function () {
  onTimeContainerButton.style.display = "block";
  timeContainer.style.display = "none";
  startDatePicker.valueAsDate = new Date();
  endDatePicker.valueAsDate = new Date();
  if(isCommonChat){
    getPublicMessages();
  } else{
    getPrivateMessages();
  }
});

const searchHttp = new XMLHttpRequest();
searchButton.addEventListener("click", function () {
  const startDate = startDatePicker.value;
  const endDate = endDatePicker.value;
  while (messageContainer.firstChild) {
    messageContainer.removeChild(messageContainer.lastChild);
  }
  if (subscription != null) subscription.unsubscribe();
  if (!isCommonChat) {
    searchHttp.open(
      "GET",
      URL +
        "saved-messages-by-date?userLogin=" +
        userLogin +
        "&companionLogin=" +
        companionLogin +
        "&startDate=" +
        startDate +
        "&endDate=" +
        endDate
    );
    searchHttp.send();
    searchHttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        let messages = JSON.parse(searchHttp.responseText);
        for (let message of messages) {
          drawMessage(message);
        }
      }
    };
  } else {
    searchHttp.open(
      "GET",
      URL +
        "saved-public-messages-by-date?startDate=" +
        startDate +
        "&endDate=" +
        endDate
    );
    searchHttp.send();
    searchHttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        let messages = JSON.parse(searchHttp.responseText);
        for (let message of messages) {
          drawPublicMessage(message);
        }
      }
    };
  }
});

const dialoguesList = document.getElementById("dialoguesList");
const choseDialogMessageHeader = document.getElementById(
  "choseDialogMessageHeader"
);
const chatContainer = document.getElementById("chatContainer");

messageContentInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    sendMessage();
  }
});

messageContentInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    sendPublicMessage();
  }
});

sendMessageButton.addEventListener("click", function () {
  sendMessage();
});

sendMessageButton.addEventListener("click", function () {
  sendPublicMessage();
});

function sendMessage() {
  if(!isCommonChat){
    let messageContent = messageContentInput.value.trim();
    if (companionLogin != null && messageContent != "") {
      let body = JSON.stringify({
        messageContent: messageContent,
        senderLogin: userLogin,
        receiverLogin: companionLogin,
      });
      messageContentInput.value = "";
      stompClient.send("/app/private-message", {}, body);
    }
  }
}

function sendPublicMessage() {
  if(isCommonChat){
    let messageContent = messageContentInput.value.trim();
    if ( messageContent != "") {
      let body = JSON.stringify({
        messageContent: messageContent,
        senderLogin: userLogin,
        receiverLogin: "no",
        senderName: userName,
      });
      messageContentInput.value = "";
      stompClient.send("/app/public-message", {}, body);
    }
  }
  
}

const chatHttp = new XMLHttpRequest();
const publicChatHttp = new XMLHttpRequest();

let stompClient = null;
const socket = new SockJS(URL + "chat");
stompClient = Stomp.over(socket);
stompClient.connect({}, {});

const usersHttp = new XMLHttpRequest();
usersHttp.open("GET", URL + "get-users?userLogin=" + userLogin);
usersHttp.send();
usersHttp.onreadystatechange = function () {
  if (this.readyState == 4 && this.status == 200) {
    let usersList = JSON.parse(usersHttp.responseText);
    for (let user of usersList) {
      const userItem = document.createElement("li");
      const avatarContainer = document.createElement("div");
      avatarContainer.style.width = "100%";
      avatarContainer.style.display = "flex";
      avatarContainer.style.alignItems = "center";
      avatarContainer.className = "img_const_msg";
      const avatarElement = document.createElement("div");
      avatarElement.style.justifyItems = "center";
      avatarElement.className = "circle user_img_msg";
      avatarElement.style.marginRight = "10px";
      const avatarText = document.createTextNode(user.name[0]);
      avatarElement.appendChild(avatarText);
      avatarElement.style["backgroundColor"] = getAvatarColor(user.name);
      avatarElement.style.display = "inline";
      avatarContainer.appendChild(avatarElement);
      const userNameText = document.createElement("span");
      userNameText.innerHTML = user.name;
      avatarContainer.appendChild(userNameText);
      userItem.appendChild(avatarContainer);
      userItem.addEventListener("click", function () {
        currentUser = user;
        getPrivateMessages();
      });
      dialoguesList.appendChild(userItem);
    }
  }
};


function getPrivateMessages(){
  isCommonChat = false;
  choseDialogMessageHeader.style.display = "none";
  chatContainer.style.display = "block";
  if (subscription != null) subscription.unsubscribe();
  companionLogin = currentUser.login;
  companionName = currentUser.name;
  companionNameHeader.innerHTML = companionName;
  while (messageContainer.firstChild) {
    messageContainer.removeChild(messageContainer.lastChild);
  }
  chatHttp.open(
    "GET",
    URL +
      "saved-messages?userLogin=" +
      userLogin +
      "&companionLogin=" +
      companionLogin
  );
  chatHttp.send();
  chatHttp.onreadystatechange = function () {
    if (this.status == 200 && this.readyState == 4) {
      let messages = JSON.parse(chatHttp.responseText);
      for (let message of messages) {
        drawMessage(message);
      }
      subscription = stompClient.subscribe(
        "/private/messages" + userLogin + "" + companionLogin,
        function (payload) {
          onMessageReceive(payload);
        }
      );
    }
  };
}

communication.addEventListener("click", function () {
  getPublicMessages();
});

function getPublicMessages(){
  isCommonChat = true;
  companionNameHeader.innerHTML = "Общий чат";
  choseDialogMessageHeader.style.display = "none";
  chatContainer.style.display = "block";
  while (messageContainer.firstChild) {
    messageContainer.removeChild(messageContainer.lastChild);
  }
  if (subscription != null) subscription.unsubscribe();
  publicChatHttp.open("GET", URL + "saved-public-messages");
  publicChatHttp.send();
  publicChatHttp.onreadystatechange = function () {
    if (this.status == 200 && this.readyState == 4) {
      let messages = JSON.parse(publicChatHttp.responseText);
      for (let message of messages) {
        drawPublicMessage(message);
      }
      subscription = stompClient.subscribe(
        "/topic/messages",
        function (payload) {
          onPublicMessagesReceive(payload);
        }
      );
    }
  };
}


const getAvatarColor = (messageSender) => {
  const colours = ["#2196F3", "#32c787", "#1BC6B4", "#A1B4C4"];
  const index = Math.abs(hashCode(messageSender) % colours.length);
  return colours[index];
};

const hashCode = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
};

function onMessageReceive(payload) {
  const message = JSON.parse(payload.body);
  drawMessage(message);
}

function onPublicMessagesReceive(payload) {
  const message = JSON.parse(payload.body);
  drawPublicMessage(message);
}

function drawMessage(message) {
  //messageContent
  //senderLogin
  //receiverLogin
  if (message.senderLogin != userLogin) {
    const messageWrapper = document.createElement("div");
    messageWrapper.className = "message-wrapper";
    const messageDiv = document.createElement("div");
    const avatarContainer = document.createElement("div");
    avatarContainer.className = "avatar-container";
    const avatarElement = document.createElement("div");
    avatarElement.className = "circle avatar-element";
    const avatarElementText = document.createElement("p");
    avatarElementText.className = "avatar-element";
    avatarElementText.innerHTML = message.senderLogin[0];
    avatarElement.appendChild(avatarElementText);
    avatarContainer.appendChild(avatarElement);
    const messageContent = document.createElement("div");
    messageContent.className = "message-content";
    const messageContentText = document.createElement("p");
    messageContentText.className = "message-content";
    messageContentText.innerHTML = message.messageContent;
    messageContent.appendChild(messageContentText);
    avatarContainer.appendChild(messageContent);
    //создаем поп ап
    const tooltip = document.createElement("p");
    tooltip.innerHTML = "Отправлено: " + message.timestamp;
    tooltip.className = "tooltip-text";
    tooltip.style.marginLeft = "50px";
    messageWrapper.addEventListener("mouseover", function () {
      tooltip.style.display = "block";
    });
    messageWrapper.addEventListener("mouseleave", function () {
      tooltip.style.display = "none";
    });
    avatarContainer.appendChild(tooltip);
    messageDiv.appendChild(avatarContainer);
    messageWrapper.appendChild(messageDiv);
    messageContainer.appendChild(messageWrapper);
  } else {
    const messageWrapper = document.createElement("div");
    messageWrapper.className = "message-wrapper";
    const messageDiv = document.createElement("div");
    const avatarContainer = document.createElement("div");
    avatarContainer.className = "avatar-container";
    avatarContainer.style.justifyContent = "right";
    const avatarElement = document.createElement("div");
    avatarElement.className = "circle avatar-element";
    avatarElement.style.marginRight = "0px";
    avatarElement.style.marginLeft = "10px";
    const avatarElementText = document.createElement("p");
    avatarElementText.className = "avatar-element";
    avatarElementText.innerHTML = message.senderLogin[0];
    avatarElement.appendChild(avatarElementText);
    const messageContent = document.createElement("div");
    messageContent.className = "message-content";
    const messageContentText = document.createElement("p");
    messageContentText.innerHTML = message.messageContent;
    messageContentText.className = "message-content";
    messageContent.appendChild(messageContentText);
    //создаем поп ап
    const tooltip = document.createElement("p");
    tooltip.innerHTML = "Отправлено: " + message.timestamp;
    tooltip.className = "tooltip-text";
    messageWrapper.addEventListener("mouseover", function () {
      tooltip.style.display = "block";
    });
    messageWrapper.addEventListener("mouseleave", function () {
      tooltip.style.display = "none";
    });
    avatarContainer.appendChild(tooltip);
    avatarContainer.appendChild(messageContent);
    avatarContainer.appendChild(avatarElement);
    messageDiv.appendChild(avatarContainer);
    messageWrapper.appendChild(messageDiv);
    messageContainer.appendChild(messageWrapper);
  }
  messageContainer.scrollTop = messageContainer.scrollHeight;
}

function drawPublicMessage(message) {
  const messageWrapper = document.createElement("div");
  messageWrapper.className = "message-wrapper";
  const messageDiv = document.createElement("div");
  const avatarContainer = document.createElement("div");
  avatarContainer.className = "avatar-container";
  avatarContainer.style.justifyContent = "right";
  const avatarElement = document.createElement("div");
  avatarElement.className = "circle avatar-element";
  avatarElement.style.borderRadius = "15px";
  avatarElement.style.width = "auto";
  avatarElement.style.marginRight = "0px";
  avatarElement.style.marginLeft = "10px";
  const avatarElementText = document.createElement("p");
  avatarElementText.className = "avatar-element";
  avatarElementText.innerHTML = message.senderName;
  avatarElement.appendChild(avatarElementText);
  const messageContent = document.createElement("div");
  messageContent.className = "message-content";
  const messageContentText = document.createElement("p");
  messageContentText.innerHTML = message.messageContent;
  messageContentText.className = "message-content";
  messageContent.appendChild(messageContentText);
  //создаем поп ап
  const tooltip = document.createElement("p");
  tooltip.innerHTML = "Отправлено: " + message.timestamp;
  tooltip.className = "tooltip-text";
  messageWrapper.addEventListener("mouseover", function () {
    tooltip.style.display = "block";
  });
  messageWrapper.addEventListener("mouseleave", function () {
    tooltip.style.display = "none";
  });
  avatarContainer.appendChild(tooltip);
  avatarContainer.appendChild(messageContent);
  avatarContainer.appendChild(avatarElement);
  messageDiv.appendChild(avatarContainer);
  messageWrapper.appendChild(messageDiv);
  if (message.senderLogin == userLogin) {
    avatarElement.style.backgroundColor = "blue";
    avatarElementText.style.backgroundColor = "blue";
    messageContent.style.backgroundColor = "blue";
    messageContentText.style.backgroundColor = "blue";
  }
  messageContainer.appendChild(messageWrapper);
  messageContainer.scrollTop = messageContainer.scrollHeight;
}
