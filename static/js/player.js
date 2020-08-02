const { ipcRenderer, remote } = require('electron')
const { Notification, dialog } = remote
const dropArea = document.getElementById('drop_area')
const player = document.getElementById('player')
const btn_prev = document.getElementById('btn_prev')
const btn_play = document.getElementById('btn_play')
const btn_next = document.getElementById('btn_next')
const progress = document.getElementById('progress')
const player_title = document.getElementById('player_title')
const player_artist = document.getElementById('player_artist')
const player_year = document.getElementById('player_year')
const player_cover = document.getElementById('player_cover')
const show_list = document.getElementById('show_list')
const jsmediatags = require('jsmediatags')
const playlist = []
let current = -1
const icon = document.querySelector('#btn_play > ion-icon')

//updated
const handelPlayPause = () => {
	if (player.paused) {
		player.play()
		icon.name = 'pause-outline'
		ipcRenderer.send('setStatus', 'نگه‌داشتن')
		new Notification({
			title: playlist[current].title,
			body: `${playlist[current].year} - ${playlist[current].artist}`,
		}).show()
	} else {
		player.pause()
		icon.name = 'play-outline'
		ipcRenderer.send('setStatus', 'پخش')
	}
}

const handelGoBack = () => {
	current > 0 && play_item(current - 1)
}
const handelGoForward = () => {
	current <= playlist.length && play_item(current + 1)
}

//new
const openFiles = () => {
	dialog
		.showOpenDialog({
			properties: ['openFile', 'multiSelections'],
			filters: [
				{
					name: 'Musics',
					extensions: ['mp3', 'wav'],
				},
			],
		})
		.then((res) => {
			res.filePaths.map((file) => insert_media(file))
		})
}
//new
ipcRenderer.on('openFiles', openFiles)
//new
ipcRenderer.on('controller', (e, arg) => {
	switch (arg) {
		case 'prev':
			current > 0 && play_item(current - 1)
			break
		case 'next':
			current <= playlist.length && play_item(current + 1)
			break
		case 'play':
			handelPlayPause()
			break
	}
})

btn_play.addEventListener('click', () => handelPlayPause())

player.ontimeupdate = () => {
	progress.max = player.duration
	progress.value = player.currentTime
}

progress.oninput = () => (player.currentTime = progress.value)

btn_prev.addEventListener('click', () => handelGoBack())

btn_next.addEventListener('click', () => handelGoForward())

player.onended = function () {
	handelGoForward()
}

const play_item = (id) => {
	current = id
	const { title, image, year, artist, path } = playlist[id]
	player_title.innerText = title
	player_year.innerText = year
	player_artist.innerText = artist
	player_cover.src = image
	player.src = path
	handelPlayPause()
}

const add_item = (data) => {
	const { id, title = '-', artist = '-', year = '-', album = '-', image } = data
	let item = `
    <div onclick="play_item(${id})" class="row py-1 music-item" id="item_${id}">
      <div class="col-2">
          <img
              src="${image}"
              alt="Cover"
              class="img-fluid responsive rounded-pill"
              width="50"
          >
      </div>
      <div class="col">
          <div class="row">
              <div class="col text-right">
                  ${title}
              </div>
              <div class="col text-left">
                  ${album}
              </div>
          </div>
          <div class="row small">
              <div class="col text-right">
                  ${artist}
              </div>
              <div class="col text-left">
                  ${year}
              </div>
          </div>
      </div>
  </div>
  `
	// play_item()
	show_list.innerHTML += item
}

const update_list = () => {
	show_list.innerHTML = ''
	playlist.forEach((music) => {
		add_item({
			id: music.id,
			title: music.title,
			album: music.album,
			artist: music.artist,
			image: music.image,
			year: music.year,
		})
	})
}

const insert_media = (file) => {
	jsmediatags.read(file, {
		onSuccess: (tag) => {
			let info = tag.tags
			let picture = info.picture
			let base64String = ''
			for (let i = 0; i < picture.data.length; i++) {
				base64String += String.fromCharCode(picture.data[i])
			}
			let imageUri =
				'data:' + picture.format + ';base64,' + window.btoa(base64String)
			const { title, album, artist, year } = info
			playlist.push({
				id: playlist.length,
				title,
				image: imageUri,
				album,
				artist,
				year,
				path: file,
			})
			update_list()
		},
		onError: () => {
			console.log('Error')
		},
	})
	update_list()
}

dropArea.ondragover = () => false

dropArea.ondragleave = () => false

dropArea.ondragend = () => false

//updated
dropArea.ondrop = (event) => {
	event.preventDefault()
	for (let file of event.dataTransfer.files) {
		insert_media(file.path)
	}
}
