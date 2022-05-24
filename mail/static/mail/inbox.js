document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  //function when email is composed
  document.querySelector('#compose-form').onsubmit=()=>{
    fetch('emails',{
      method:'POST',
      body:JSON.stringify({
        recipients:document.querySelector('#compose-recipients').value,
        subject:document.querySelector('#compose-subject').value,
        body:document.querySelector('#compose-body').value,
      })
    })
    .then(response=>response.json())
    .then(data=>{
      if(data['message']){
        load_mailbox('sent')
      }
      else{
        console.log(data['error'])
      }
    });
    return false;
  };

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-detail').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-detail').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  //display each email
  fetch(`emails/${mailbox}`)
  .then(response=>response.json())
  .then(data=>{
    data.forEach(email=>{
      //container for email
      let div=document.createElement('div');
      div.className='email';
      div.dataset.id=email['id']
      //container for sender of email
      sender=document.createElement('div');
      sender.innerHTML=email['sender']
      sender.className='sender';
      div.append(sender);
      //container for subject of email
      subject=document.createElement('div');
      subject.innerHTML=email['subject']
      subject.className='subject';
      div.append(subject);
      //container for time of email
      time=document.createElement('div');
      time.innerHTML=email['timestamp']
      time.className='time';
      div.append(time);
      //add email container to index container
      document.querySelector('#emails-view').append(div);
      //gray if read
      if(email['read']===true){
        div.style.backgroundColor='lightgray';
      }
      //detail of email on click
      div.onclick=()=>{details(div,mailbox)}
    });
  });
  
}
function details(email,mailbox){
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-detail').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail').innerHTML='';

  //get details
  fetch(`emails/${email.dataset.id}`)
  .then(response=>response.json())
  .then(data=>{
    div=document.querySelector('#email-detail');
    //create container with sender
    sender=document.createElement('div');
    sender.innerHTML=`From: ${data['sender']}`;
    sender.id='sender';
    div.append(sender);
    //create container with recipients
    recipients=document.createElement('div');
    recipients.innerHTML=`To: ${data['recipients']}`;
    div.append(recipients);
    //create container with subject
    subject=document.createElement('div');
    subject.innerHTML=`Subject: ${data['subject']}`;
    div.append(subject);
    //create container with timestamp
    timestamp=document.createElement('div');
    timestamp.innerHTML=`Timestamp: ${data['timestamp']}`;
    div.append(timestamp);

    //no button if email is in sent mailbox
    if(mailbox!=='sent'){
      //reply button
      replyButton=document.createElement('button');
      replyButton.className="btn btn-sm btn-outline-primary";
      replyButton.id='reply';
      replyButton.innerHTML="Reply";
      replyButton.onclick=reply;
      div.append(replyButton);

      //archive/unarchive button
      archiveButton=document.createElement('button');
      archiveButton.className="btn btn-sm btn-outline-primary";
      archiveButton.id='archive';
      //Unarchive archived email
      if(mailbox==='archive'){
        archiveButton.innerHTML="Unarchive";
        archiveButton.onclick=unarchive;
      }
      //message not archived
      else{
        archiveButton.innerHTML="Archive";
        archiveButton.onclick=archive;
      }
      div.append(archiveButton);
    }

    //button functions
    //reply
    function reply(){
      compose_email();
      document.querySelector('#compose-recipients').value = sender.innerHTML.replace('From: ','');
      if(subject.innerHTML.indexOf('Re: ')===-1)
        document.querySelector('#compose-subject').value = `Re: ${subject.innerHTML.replace('Subject: ','')}`;
      else
      document.querySelector('#compose-subject').value = subject.innerHTML;
      
      document.querySelector('#compose-body').value = `On ${timestamp.innerHTML.replace('Timestamp: ','')} ${sender.innerHTML.replace('From: ','')} wrote:\n${body.innerHTML}`;
    }
    //unarchive
    function unarchive(){
      fetch(`emails/${email.dataset.id}`,{
        method:'PUT',
        body:JSON.stringify({archived:false})
      })
      details(email,'inbox')
    }
    //archive
    function archive(){
      fetch(`emails/${email.dataset.id}`,{
        method:'PUT',
        body:JSON.stringify({archived:true})
      })
      details(email,'archive');
    }

    //Seperation line
    div.append(document.createElement('hr'))
    //create container with body
    body=document.createElement('div');
    body.innerHTML=data['body'];
    div.append(body);
  })
  markRead(email);
}

function markRead(email){
  //mark email as read
  fetch(`emails/${email.dataset.id}`,{
    method:"PUT",
    body:JSON.stringify({read:true})
  })
}
