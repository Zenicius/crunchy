//npm
import React from 'react';
//localization
import {FormattedMessage} from 'react-intl';
//api
import {Crunchyroll} from '../crunchyroll';
// preferences
import Preferences from '../localization/preferences';
//ui
import {Message, Button, Icon, Divider} from 'semantic-ui-react';

export default class Episode extends React.Component {
  constructor(props) {
    super(props);
    this.isPlaying = false;
    this._isMounted = false;
    this.state = {
      episode: null,
      file: null,
    };

    // load episode
    this.init(props);
  }

  async init(props) {
    const {location} = props;
    const file = await Crunchyroll.getEpisode(location.state);

    if (this._isMounted) {
      this.setState({
        episode: location.state,
        file,
      });
    }
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentDidUpdate() {
    const {episode, file} = this.state;

    // Dont do nothing if theres no file, episode or if theres an error
    if (!episode || !file || file.err !== null) return;

    // format subtitles
    const formatedSubtitles = file.subtitles.map(subtitle => {
      return {
        src: subtitle.link,
        label: subtitle.label,
        enabled: subtitle.default,
      };
    });

    // get language from preferences (if ptbr format to videojs)
    const preferences = new Preferences();
    var lang = preferences.get('lang');
    if (lang == 'pt') lang += '-BR';

    // player config
    const player = videojs('video', {
      fluid: true,
      autoplay: true,
      controls: true,
      textTrackSettings: false,
      language: lang,
      plugins: {
        ass: {},
      },
    });

    // add all available subtitles
    player.on('ready', () => {
      formatedSubtitles.forEach(subtitle => {
        player.ass().addSubtitle(subtitle.src, subtitle.label, null, subtitle.enabled);
      });
    });
  }

  componentWillUnmount() {
    this._isMounted = false;

    // if videojs is initilized destroy to create another later
    if (this.isPlaying) {
      videojs('video').dispose();
    } else {
      return;
    }
  }

  render() {
    const {episode, file} = this.state;
    const {history} = this.props;

    // Loading default
    let body = (
      <div>
        <Divider />
        <Message icon>
          <Icon name="circle notched" loading />
          <Message.Content>
            <Message.Header><FormattedMessage id="Loading" defaultMessage="Loading" />...</Message.Header>
            <FormattedMessage id="Loading.SubtitlesMessage" defaultMessage="Downloading Subtitles" />
          </Message.Content>
        </Message>
      </div>
    );
    // video player if ready
    if (episode && file) {
      // No error, start video
      if (file.err == null) {
        this.isPlaying = true;
        body = (
          <div>
            <Divider />
            <video id="video" className="video-js vjs-default-skin vjs-big-play-centered vjs-fluid" preload="auto">
              <source src={file.url} type={file.type} />
            </video>
          </div>
        );
      } else {
        body = (
          <div>
            <Divider />
            <Message negative icon>
              <Icon name="info" />
              <Message.Content>
                <Message.Header>{file.err}</Message.Header>
                {file.errMessage}
              </Message.Content>
            </Message>
          </div>
        );
      }
    }

    return (
      <div>
        <Button href="#back" icon labelPosition="left" color="grey" className="button" onClick={() => history.goBack()}>
          <Icon name="arrow left" />
          <FormattedMessage id="Button.Back" defaultMessage="Back" />
        </Button>
        {body}
      </div>
    );
  }
}
