//npm
import React from 'react';
//api
import {Crunchyroll} from '../crunchyroll';
//ui
import {Message, Button, Icon} from 'semantic-ui-react';

export default class Episode extends React.Component {
  constructor(props) {
    super(props);
    this.isPlaying = false;
    this.state = {
      episode: null,
      file: null,
    };
    //load episode
    this.init(props);
  }

  componentDidUpdate() {
    const {episode, file} = this.state;

    if (!episode || !file) return;

    //Subtitles plugin e config
    videojs('video', {
      fluid: true,
      plugins: {
        ass: {
          src: file.subtitles,
        },
      },
    });
  }

  componentWillUnmount() {
    //if videojs is initilized destroy to create another later
    if (this.isPlaying) {
      videojs('video').dispose();
    } else {
      return;
    }
  }

  async init(props) {
    const {location} = props;
    const file = await Crunchyroll.getEpisode(location.state);
    this.setState({
      episode: location.state,
      file,
    });
  }

  render() {
    const {episode, file} = this.state;
    const {history} = this.props;

    //Loading default
    let body = (
      <div>
        <Message icon>
          <Icon name="circle notched" loading />
          <Message.Content>
            <Message.Header>Loading...</Message.Header>
            Downloading Subtitles...
          </Message.Content>
        </Message>
      </div>
    );
    //video player if ready
    if (episode && file) {
      this.isPlaying = true;
      body = (
        <video
          id="video"
          className="video-js vjs-default-skin vjs-big-play-centered vjs-fluid"
          controls
          autoPlay
          preload="auto"
        >
          <source src={file.url} type={file.type} />
        </video>
      );
    }

    return (
      <div>
        <Button href="#back" icon labelPosition="left" color="grey" className="button" onClick={() => history.goBack()}>
          <Icon name="arrow left" />
          Back
        </Button>
        {body}
      </div>
    );
  }
}
