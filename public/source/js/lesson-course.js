async function postComment() {  
    var form = document.querySelector("#formElem");

    let data = form.querySelector("textarea[id='textarea-comment']").value;

    let response = await fetch('./', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({comment: data}),
        json: true
    })

    let text = await response.json(); 
    alert(text.message);
};

async function postReply(commendID, reply_text) {  
    let response = await fetch(`./comment/${commendID}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({reply: reply_text}),
        json: true
    })

    let text = await response.json(); 
    alert(text.message);
}

function toggleReply(element) {
    // Get the reply box
    var replyBox = element.parentElement.querySelector(".reply-box");
  
    // Check if the reply box is empty (no textarea yet)
    if (replyBox.innerHTML === "") {
      // Create a textarea and a send button
      var textarea = document.createElement("textarea");
      var sendButton = document.createElement("button");
  
      // Set attributes for textarea and button
      textarea.placeholder = "Viết bình luận...";
      sendButton.innerText = "Bình luận";
      sendButton.onclick = function() {
        // Call sendReply function with replyBox reference, commentID, and the textarea value
        sendReply(replyBox, element.id, textarea.value);
        replyBox.removeChild(textarea);
        replyBox.removeChild(sendButton);
      };
  
      // Append textarea and button to the reply box
      replyBox.appendChild(textarea);
      replyBox.appendChild(sendButton);
    } else {
      // If the reply box is not empty (textarea already exists), remove it
      replyBox.innerHTML = "";
    }
    
}
  
async function sendReply(replyBox, commentID, replyText) {
    console.log("Comment ID: " + commentID);
    console.log("Reply: " + replyText);

    postReply(commentID, replyText);
  
    // Clear textarea after send
    replyBox.firstChild.value = '';
  
    // Create a new reply
    var newReply = document.createElement("div");
    newReply.classList.add("reply-all-comment");
  
    var commentUser = document.createElement("div");
    commentUser.classList.add("comment-user");
  
    var user = document.createElement("div");
    user.classList.add("user");
  
    var userAvatar = document.createElement("img");
    userAvatar.src = '/public/source/img/user-avatar.jpg';
    userAvatar.alt = '';
    userAvatar.classList.add("user-avatar");
  
    var commentForm = document.createElement("div");
    commentForm.classList.add("comment-form");

    var userNameCmt = document.createElement("div");
    userNameCmt.classList.add("user-name-cmt");
  
    var userName = document.createElement("a");
    userName.innerText = "Bạn"; // Replace with the actual username
    ///userName.classList.add("user-name-cmt");
  
    var userComment = document.createElement("p");
    userComment.innerText = replyText;
    userComment.classList.add("user-comment");
  
    var replyContainer = document.createElement("div");
    replyContainer.classList.add("reply");
  
    // Append elements to the new reply
    user.appendChild(userAvatar);
    
    commentUser.appendChild(user);
    commentUser.appendChild(commentForm);
    newReply.appendChild(commentUser);
    newReply.appendChild(replyContainer);
    commentForm.appendChild(userNameCmt);
    userNameCmt.appendChild(userName);
    commentForm.appendChild(userComment);
  
    // Get the .all-comment container
    var allComment = replyBox.parentElement.parentElement;
  
    // Insert the new reply into the .all-comment container
    allComment.appendChild(newReply);
  }
  