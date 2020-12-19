const socket = io()
const $messageForm        = document.querySelector('#message-form')
const $messageFormInput   = $messageForm.querySelector('input')  
const $messageFormButton  = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#LOCATION') 
const $message            = document.querySelector('#messages')
const $messagetemplet     = document.querySelector('#message-templet').innerHTML
const locationMessageTemplet = document.querySelector('#location-message-templet').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message element
    const $newMessage = $message.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $message.offsetHeight

    // Height of messages container
    const containerHeight = $message.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $message.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $message.scrollTop = $message.scrollHeight
    }
}

socket.on('message',(msg) => {
    console.log(msg)
    const html = Mustache.render($messagetemplet,{
        username : msg.username,
        message   : msg.text,
        createdAt : moment(msg.createdAt).format('h:mm a')
    })
    $message.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

 socket.on('location',(url) => {
     console.log(url)
     const html = Mustache.render(locationMessageTemplet,{
        username : url.username,
        url   : url.text,
        createdAt : moment(url.createdAt).format('h:mm a')
    })
     $message.insertAdjacentHTML('beforeend',html)
    autoscroll()
})
socket.on('roomData',({room,users}) =>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
}) 

$messageForm.addEventListener('submit',(e) => {
        e.preventDefault()
        $messageFormButton.setAttribute('disabled','disabled')

        const message =  e.target.elements.message.value  //document.querySelector('input').value
        socket.emit('sendMessage',message,(error) =>{
            $messageFormButton.removeAttribute('disabled')
            $messageFormInput.value = ''
            $messageFormInput.focus()
            if(error) {
               return console.log(error)
            }
            console.log(`Message is sended`)
        })
})
$sendLocationButton.addEventListener('click',(e) => {
    if(!navigator.geolocation) {
        return SpeechRecognitionAlternative('your area is not avaliable')
    }
    $sendLocationButton.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        console.log(position)
        socket.emit('sendLocation',{
            latitude  : position.coords.latitude,
            longitude : position.coords.longitude
        },() => {
            $sendLocationButton.removeAttribute('disabled')
            console.log('location is sended')
        })
    })
})
socket.emit('join',{username,room},(error) =>{
    if(error) {
        alert(error)
        location.href = '/'
    }
})