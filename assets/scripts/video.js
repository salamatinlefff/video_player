const VOLUME_ICONS = {
  up: 'fa-volume-up',
  down: 'fa-volume-down',
  off: 'fa-volume-off',
  mute: 'fa-volume-mute',
};

const FULLSCREEN_ICONS = {
  compress: 'fa-compress',
  expand: 'fa-expand',
};

class Player {
  constructor(selector) {
    this.player = document.querySelector(selector);
    this.video = this.player?.querySelector('video');

    if(!this.player || !this.video) {
      throw new Error('Player or video not found');
    }

    this.initVideoListeners();
    this.initPlayerListeners();
    this.initTimeLiveListeners();
    this.initPageListeners();
  }
    initVideoListeners() {
      const playButton = document.querySelectorAll('.play-button');
      playButton.forEach( button => button.addEventListener('click', this.toggleVideo.bind(this)) );
      this.video.addEventListener('click', this.toggleVideo.bind(this));
      this.video.addEventListener('loadedmetadata', () => {
        this.setVideoDuration();
        this.updateVolumeInput();
      });
      this.video.addEventListener('timeupdate', () => {
        this.setVideoDuration();
        this.toggleInterface();
        });
      this.video.addEventListener('volumechange', this.updateVolumeInput.bind(this))
    }

    initPlayerListeners() {
      this.player.addEventListener('fullscreenchange', this.checkFullscreen.bind(this));
      this.player.addEventListener('mousemove', () => {
        this.checkInterface()
      });
      this.player.querySelector('.j-toggle-video').addEventListener('click', this.toggleVideo);
      this.player.querySelector('.j-volume-input').addEventListener('input', this.setVolume.bind(this));
      this.player.querySelector('.j-toggle-volume'). addEventListener('click', () => {
        if(this.video.volume > 0) {
          localStorage.setItem('volume', this.video.volume)
          this.video.volume = 0;
        } else {
          this.video.volume = localStorage.getItem('volume');
        }
      });
      this.player.querySelector('.j-fullscreen').addEventListener('click', this.toggleFullscreen.bind(this));
    }

    initTimeLiveListeners() {
      const line = this.player.querySelector('.j-line');
      line.addEventListener('mousemove', this.calcGhostLine.bind(this));
      line.addEventListener('click', event => {
        const { left } = event.target.getBoundingClientRect();
        this.video.currentTime = this.calcNeededLine(event, left)
      });
    }
    initPageListeners() {
      document.addEventListener('keydown', (event) => {
        if(event.code ==='Space') {
          event.preventDefault();
          this.toggleVideo();
    
        } else if(event.code === 'ArrowRight') {
          this.rewindForward();
        } else if (event.code === 'ArrowLeft') {
          this.rewindBackward();
          
        } else if(event.code === 'KeyF') {
          this.toggleFullscreen();
        }
      })
    }

    rewindForward() {
      this.video.currentTime += 5;
      this.showRewind('.j-forward');
    }

    rewindBackward() {
      this.video.currentTime -= 5;
      this.showRewind('.j-backward');
    }

    showRewind(rewindClass) {
      this.player.querySelector(rewindClass).style.display = 'none';
      this.isRewind = true;

      if(this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = null;
      }

      this.timeout = setTimeout(() => {
        this.isRewind = false;
        this.player.querySelector(rewindClass).style.display = 'flex';
        this.player.querySelector(rewindClass).style.zIndex = '2';

      }, 150)
    }

    toggleVideo() {
      this.isPlaying = !this.isPlaying;

      const icon = this.player.querySelector('.j-toggle-video .fa-solid');

      this.player.querySelector('.j-play').style.display = this.isPlaying ? 'flex' : 'none';
      this.player.querySelector('.j-play').style.zIndex = '2';

      this.player.querySelector('.j-pause').style.display = !this.isPlaying ? 'flex' : 'none';
      this.player.querySelector('.j-pause').style.zIndex = '2';

      icon.classList.toggle('fa-play', !this.isPlaying);
      icon.classList.toggle('fa-pause', this.isPlaying);

      this.video[this.isPlaying ? 'play' : 'pause']();
    }

    fixNumber(number) {
      return number < 10 ? `0${number}` : `${number}`;
    }

    formatTime(seconds) {
      return `${this.fixNumber(Math.floor(seconds / 60))}:${this.fixNumber(Math.floor(seconds % 60))}`;
    }

    setVideoDuration() {
      const duration = Number(this.video.duration.toFixed());
      const current = Number(this.video.currentTime.toFixed());
      const newTime = `${this.formatTime(current)} / ${this.formatTime(duration)}`;
      const durationElement = this.player.querySelector('.j-duration');
      const playerPanel = this.player.querySelector('.player__panel');
      const playButton = this.player.querySelector('.video__play-button');

      this.player.querySelector('.player__line_current').style.width = `${current / (duration / 100)}%`;

      if(durationElement.innerHTML !== newTime) {
        durationElement.innerHTML = newTime;
      }

      if(this.video.currentTime === 0) {
        playerPanel.classList.remove('player__panel_visible');
        playButton.classList.remove('play-button_hide')
      } else {
        playerPanel.classList.add('player__panel_visible');
        playButton.classList.add('play-button_hide')
      }
    }

    toggleFullscreen() {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        this.player.requestFullscreen();
      }
    }

    checkFullscreen() {
      const isFullscreen = Boolean(document.fullscreenElement);
      const icon = this.player.querySelector('.j-fullscreen');

      icon.classList.toggle(FULLSCREEN_ICONS.expand, !isFullscreen);
      icon.classList.toggle(FULLSCREEN_ICONS.compress, isFullscreen);

      this.player.classList.toggle('player__fullscreen', isFullscreen)
    }

    setVolume({ target }) {
      this.video.volume = target.value / 100;
    }

    updateVolumeInput() {
      const toggleClasses = this.player.querySelector('.j-toggle-volume').classList;
      const volumeInput = this.player.querySelector('.j-volume-input');
      
      this.player.querySelector('.j-volume-input').value = this.video.volume * 100; 

      volumeInput.style.background = `linear-gradient(to right, rgb(228, 188, 9) ${volumeInput.value}%, rgba(255, 255, 255, 0.4) ${volumeInput.value}%, rgba(255, 255, 255, 0.4) 100%)`;

      toggleClasses.remove(VOLUME_ICONS.up, VOLUME_ICONS.down, VOLUME_ICONS.off, VOLUME_ICONS.mute)

        if(this.video.volume > 0.66) {
          toggleClasses.add(VOLUME_ICONS.up)
        } else if(this.video.volume > 0.33) {
          toggleClasses.add(VOLUME_ICONS.down)
        } else if (this.video.volume > 0) {
          toggleClasses.add(VOLUME_ICONS.off)
        } else if (this.video.volume === 0) {
          toggleClasses.add(VOLUME_ICONS.mute)
        }
    }

    calcNeededLine(event, left) {
      const needPercent = (event.pageX - left) / event.target.offsetWidth;

      return this.video.duration * needPercent;
    }

    calcGhostLine(event) {
      const { left } = event.target.getBoundingClientRect();
      const hint = this.player.querySelector('.j-hint');
      const ghost = this.player.querySelector('.j-line-ghost');

      hint.innerHTML = this.formatTime(this.calcNeededLine(event, left));
      hint.style.left = `${event.pageX - (left + (hint.offsetWidth / 2))}px`;
      ghost.style.width = `${event.pageX - left}px`;
    }

    toggleInterface() {
        this.player.classList.toggle('player__hide-interface', this.isHiddenInterface);
    }

    checkInterface() {
      this.isHiddenInterface = false;
      this.player.classList.remove('player__hide-interface');
  
      if(this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = null;
      }

      this.timeout = setTimeout(() => {
        this.isHiddenInterface = true;
      }, 5000)
    }
  
}

const player = new Player('.j-player');