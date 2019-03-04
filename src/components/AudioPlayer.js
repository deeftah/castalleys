import React from 'react';
import { Link } from 'react-router-dom';
import { formatSeconds, convertTimeString } from '../helpers';

class AudioPlayer extends React.Component {
  audio = React.createRef();
  progressBar = React.createRef();

  state = {
    timePlayed: '--:--:--',
    percent: 0,
    playFromLastTime: false
  };

  componentDidMount() {
    const timePlayedRef = localStorage.getItem('timePlayed');
    const episodeOnPlayRef = localStorage.getItem('episodeOnPlay');
    if (timePlayedRef && timePlayedRef !== '0' && episodeOnPlayRef) {
      const duration = convertTimeString(JSON.parse(episodeOnPlayRef).duration);
      const percent = (JSON.parse(timePlayedRef) / duration) * 100;
      this.setState({
        timePlayed: formatSeconds(JSON.parse(timePlayedRef)),
        percent,
        playFromLastTime: true
      });
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.episodeOnPlay && !this.props.hidePlayer) {
      const audio = this.audio.current;
      const method = this.props.playing ? 'play' : 'pause';
      audio[method]();
      if (this.state.playFromLastTime) {
        // this is to trigger the execution of this.updateCurrentTime in the background to get two benefits: 1) pre-load the audio's current time, 2) set this.state.playFromLastTime to false timely so the current time won't be set to the stored time when the page is loaded with a stored episode on play but the user clicks another episode to play.
        audio.currentTime = JSON.parse(localStorage.getItem('timePlayed'));
      }
      if (this.props.speed !== prevProps.speed) {
        audio.playbackRate = this.props.speed;
      }
      if (
        prevProps.episodeOnPlay.episodeId &&
        this.props.episodeOnPlay.episodeId !== prevProps.episodeOnPlay.episodeId
      ) {
        this.setState({
          timePlayed: '--:--:--',
          percent: 0
        });
      }
    }
  }

  updatePlaybackControls = e => {
    const audio = this.audio.current;
    if (e.target.className.baseVal === 'playPause') {
      this.props.onClick('playPause');
    } else if (e.target.className === 'speed') {
      this.props.onClick('speed');
    } else if (e.target.className.baseVal === 'replay') {
      if (audio.currentTime <= 10) {
        audio.currentTime = 0;
      } else {
        audio.currentTime += parseFloat(e.target.dataset.skip);
      }
    } else if (e.target.className.baseVal === 'forward') {
      if (audio.currentTime + 10 > audio.duration) {
        audio.currentTime = audio.duration;
      } else {
        audio.currentTime += parseFloat(e.target.dataset.skip);
      }
    }
  };

  scrub = e => {
    const audio = this.audio.current;
    const progressBar = this.progressBar.current;
    const scrubTime =
      (e.nativeEvent.offsetX / progressBar.offsetWidth) * audio.duration; // attention: e.nativeEvent.offsetX instead of e.offsetX because of SyntheticEvent (https://reactjs.org/docs/events.html)
    audio.currentTime = scrubTime;
  };

  updateCurrentTime = () => {
    const audio = this.audio.current;
    if (this.state.playFromLastTime) {
      // this is to update the current time of the audio based on the timePlayed stored in local storage from last time (if any) so that when the play button is clicked, the audio can play from the right position, instead of from the beginning.
      audio.currentTime = JSON.parse(localStorage.getItem('timePlayed'));
      this.setState({
        playFromLastTime: false
      });
    } else {
      const percent = (audio.currentTime / audio.duration) * 100 || 0;
      this.setState({
        timePlayed: formatSeconds(audio.currentTime),
        percent
      });
      localStorage.setItem('timePlayed', audio.currentTime);
    }
  };

  stopPlayingAndRemovePlayer = () => {
    const audio = this.audio.current;
    audio['pause']();
    this.props.removePlayer();
    localStorage.removeItem('timePlayed');
    this.setState({
      timePlayed: '--:--:--',
      percent: 0,
      playFromLastTime: false
    });
  };

  render() {
    if (
      this.props.hidePlayer ||
      !Object.keys(this.props.episodeOnPlay).length
    ) {
      return null;
    } else {
      const timePlayed = this.state.timePlayed;
      const percent = this.state.percent;
      const speed = this.props.speed;
      const {
        image,
        episodeId,
        podcastId,
        episodeTitle,
        podcastTitle,
        audio,
        duration
      } = this.props.episodeOnPlay;
      const togglePlayIcon = this.props.playing ? (
        <svg
          className="playPause"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <path
            className="playPause"
            d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"
            fill={this.props.customColor}
          />
          <path className="playPause" d="M0 0h24v24H0z" fill="none" />
        </svg>
      ) : (
        <svg
          className="playPause"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <path
            className="playPause"
            d="M8 5v14l11-7z"
            fill={this.props.customColor}
          />
          <path className="playPause" d="M0 0h24v24H0z" fill="none" />
        </svg>
      );
      let mousedown = false;

      return (
        <div className="wrapper">
          <div className="player">
            <div className="episode-info">
              <Link
                to={`/episode/${episodeId}`}
                onClick={this.props.resetSearchbar}
              >
                <img
                  className="artwork-in-player"
                  src={image}
                  alt="podcast artwork"
                />
              </Link>
              <div className="titles-in-player">
                <Link
                  to={`/episode/${episodeId}`}
                  onClick={this.props.resetSearchbar}
                  className="title1"
                >
                  {episodeTitle}
                </Link>
                <br />
                <Link
                  to={`/podcast/${podcastId}`}
                  onClick={this.props.resetSearchbar}
                  className="title2"
                >
                  {podcastTitle}
                </Link>
              </div>
            </div>
            <div className="player-controls">
              <div
                className="main-controls"
                onClick={this.updatePlaybackControls}
              >
                <span className="speed">{speed}x</span>
                <span className="playcontrols">
                  <svg
                    className="replay"
                    data-skip="-10"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                  >
                    <defs>
                      <path className="replay" d="M0 0h24v24H0V0z" />
                    </defs>
                    <clipPath>
                      <use xlinkHref="#a" overflow="visible" />
                    </clipPath>
                    <path
                      className="replay"
                      d="M12 5V1L7 6l5 5V7c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6H4c0 4.4 3.6 8 8 8s8-3.6 8-8-3.6-8-8-8zm-1.1 11H10v-3.3L9 13v-.7l1.8-.6h.1V16zm4.3-1.8c0 .3 0 .6-.1.8l-.3.6s-.3.3-.5.3-.4.1-.6.1-.4 0-.6-.1-.3-.2-.5-.3-.2-.3-.3-.6-.1-.5-.1-.8v-.7c0-.3 0-.6.1-.8l.3-.6s.3-.3.5-.3.4-.1.6-.1.4 0 .6.1c.2.1.3.2.5.3s.2.3.3.6.1.5.1.8v.7zm-.9-.8v-.5s-.1-.2-.1-.3-.1-.1-.2-.2-.2-.1-.3-.1-.2 0-.3.1l-.2.2s-.1.2-.1.3v2s.1.2.1.3.1.1.2.2.2.1.3.1.2 0 .3-.1l.2-.2s.1-.2.1-.3v-1.5z"
                      clipPath="url(#b)"
                      fill={this.props.customColor}
                    />
                  </svg>
                  {togglePlayIcon}
                  <svg
                    className="forward"
                    data-skip="10"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                  >
                    <defs>
                      <path className="forward" d="M24 24H0V0h24v24z" />
                    </defs>
                    <clipPath>
                      <use xlinkHref="#a" overflow="visible" />
                    </clipPath>
                    <path
                      className="forward"
                      d="M4 13c0 4.4 3.6 8 8 8s8-3.6 8-8h-2c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6v4l5-5-5-5v4c-4.4 0-8 3.6-8 8zm6.8 3H10v-3.3L9 13v-.7l1.8-.6h.1V16zm4.3-1.8c0 .3 0 .6-.1.8l-.3.6s-.3.3-.5.3-.4.1-.6.1-.4 0-.6-.1-.3-.2-.5-.3-.2-.3-.3-.6-.1-.5-.1-.8v-.7c0-.3 0-.6.1-.8l.3-.6s.3-.3.5-.3.4-.1.6-.1.4 0 .6.1.3.2.5.3.2.3.3.6.1.5.1.8v.7zm-.8-.8v-.5s-.1-.2-.1-.3-.1-.1-.2-.2-.2-.1-.3-.1-.2 0-.3.1l-.2.2s-.1.2-.1.3v2s.1.2.1.3.1.1.2.2.2.1.3.1.2 0 .3-.1l.2-.2s.1-.2.1-.3v-1.5z"
                      clipPath="url(#b)"
                      fill={this.props.customColor}
                    />
                  </svg>
                </span>
                <div className="tooltip">
                  <svg
                    className="remove"
                    onClick={this.stopPlayingAndRemovePlayer}
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                  >
                    <path
                      className="remove"
                      d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5l-1-1h-5l-1 1H5v2h14V4z"
                    />
                    <path className="remove" fill="none" d="M0 0h24v24H0V0z" />
                  </svg>
                  <span className="tooltiptext">remove</span>
                </div>
              </div>
              <div className="progress">
                <div
                  ref={this.progressBar}
                  className="progressbar"
                  onClick={this.scrub}
                  onMouseMove={e => mousedown && this.scrub(e)}
                  onMouseDown={() => (mousedown = true)}
                  onMouseUp={() => (mousedown = false)}
                >
                  <div
                    className="progressbar-filled"
                    style={{ flexBasis: percent + '%' }}
                  />
                </div>
                <div className="timer">
                  <span ref={this.currentTime} id="time-elapsed">
                    {timePlayed}
                  </span>
                  <span id="total-time">{duration}</span>
                </div>
              </div>
            </div>
            <audio
              src={audio}
              ref={this.audio}
              onTimeUpdate={this.updateCurrentTime}
              onEnded={this.props.onEnded}
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        </div>
      );
    }
  }
}

export default AudioPlayer;
