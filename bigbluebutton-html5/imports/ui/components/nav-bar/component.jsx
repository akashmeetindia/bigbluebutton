import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Session } from 'meteor/session';
import cx from 'classnames';
import { makeCall } from '/imports/ui/services/api';
import { withModalMounter } from '/imports/ui/components/modal/service';
import withShortcutHelper from '/imports/ui/components/shortcut-help/service';
import getFromUserSettings from '/imports/ui/services/users-settings';
import { defineMessages, injectIntl } from 'react-intl';
//import Icon from '../icon/component';
import { styles } from './styles.scss';
import Button from '../button/component';
import RecordingIndicator from './recording-indicator/container';
//import TalkingIndicatorContainer from '/imports/ui/components/nav-bar/talking-indicator/container';
//import SettingsDropdownContainer from './settings-dropdown/container';
import EndMeetingConfirmationContainer from '/imports/ui/components/end-meeting-confirmation/container';

const intlMessages = defineMessages({
  leaveSessionLabel: {
    id: 'app.navBar.settingsDropdown.leaveSessionLabel',
    description: 'Leave session button label',
  },
  endMeetingLabel: {
    id: 'app.navBar.settingsDropdown.endMeetingLabel',
    description: 'End meeting options label',
  },
  endMeetingDesc: {
    id: 'app.navBar.settingsDropdown.endMeetingDesc',
    description: 'Describes settings option closing the current meeting',
  },
  toggleUserListLabel: {
    id: 'app.navBar.userListToggleBtnLabel',
    description: 'Toggle button label',
  },
  toggleUserListAria: {
    id: 'app.navBar.toggleUserList.ariaLabel',
    description: 'description of the lists inside the userlist',
  },
  newMessages: {
    id: 'app.navBar.toggleUserList.newMessages',
    description: 'label for toggleUserList btn when showing red notification',
  },
});

const propTypes = {
  presentationTitle: PropTypes.string,
  hasUnreadMessages: PropTypes.bool,
  shortcuts: PropTypes.string,
  isBreakoutRoom: PropTypes.bool,
  isMeteorConnected: PropTypes.bool.isRequired,
};

const defaultProps = {
  presentationTitle: 'Default Room Title',
  hasUnreadMessages: false,
  shortcuts: '',
  isBreakoutRoom: false,
};

class NavBar extends PureComponent {
  constructor(props) {
    super(props);

    // Set the logout code to 680 because it's not a real code and can be matched on the other side
    this.LOGOUT_CODE = '680';

    this.leaveSession = this.leaveSession.bind(this);
  }
  static handleToggleUserList() {
    Session.set(
      'openPanel',
      Session.get('openPanel') !== ''
        ? ''
        : 'userlist',
    );
    Session.set('idChatOpen', '');
  }

  componentDidMount() {
    const {
      processOutsideToggleRecording,
      connectRecordingObserver,
    } = this.props;

    if (Meteor.settings.public.allowOutsideCommands.toggleRecording
      || getFromUserSettings('bbb_outside_toggle_recording', false)) {
      connectRecordingObserver();
      window.addEventListener('message', processOutsideToggleRecording);
    }
  }

  leaveSession() {
    makeCall('userLeftMeeting');
    // we don't check askForFeedbackOnLogout here,
    // it is checked in meeting-ended component
    Session.set('codeError', this.LOGOUT_CODE);
    // mountModal(<MeetingEndedComponent code={LOGOUT_CODE} />);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    const {
      hasUnreadMessages,
      isExpanded,
      intl,
      shortcuts: TOGGLE_USERLIST_AK,
      mountModal,
      presentationTitle,
      amIModerator,
      isBreakoutRoom,
      isMeteorConnected,
    } = this.props;

    const allowedToEndMeeting = amIModerator && !isBreakoutRoom;
    const toggleBtnClasses = {};
    toggleBtnClasses[styles.btn] = true;
    toggleBtnClasses[styles.btnWithNotificationDot] = hasUnreadMessages;

    let ariaLabel = intl.formatMessage(intlMessages.toggleUserListAria);
    ariaLabel += hasUnreadMessages ? (` ${intl.formatMessage(intlMessages.newMessages)}`) : '';

    return (
      <div className={styles.navbar}>
        <div className={styles.top}>
        <div className={styles.left}>
          <Button
              data-test="userListToggleButton"
              onClick={NavBar.handleToggleUserList}
              circle
              data-test={hasUnreadMessages ? 'hasUnreadMessages' : null}
              label={intl.formatMessage(intlMessages.toggleUserListLabel)}
              aria-label={ariaLabel}
              icon="user"
              size="lg"
              color={Session.get('openPanel') !== '' ? 'primary' : 'default'}
              className={styles.btnParticipants}
            />
        </div>
        <div className={styles.center}>
          <RecordingIndicator
              mountModal={mountModal}
              amIModerator={amIModerator}
            />
        </div>
        <div className={styles.right}>
        {allowedToEndMeeting && isMeteorConnected ?
        <Button
          className={styles.btnEndMeeting}
          onClick={() => mountModal(<EndMeetingConfirmationContainer />)}
          aria-label={intl.formatMessage(intlMessages.endMeetingLabel)}
          label={intl.formatMessage(intlMessages.endMeetingLabel)}
          color={'danger'}
          icon={'delete'}
          size="lg"
          circle
        />
        : null}
            <Button
          className={cx(styles.button || styles.btn)}
          onClick={() => this.leaveSession()}
          aria-label={intl.formatMessage(intlMessages.leaveSessionLabel)}
          label={intl.formatMessage(intlMessages.leaveSessionLabel)}
          color={'danger'}
          icon={'logout'}
          size="lg"
          circle
        />
        </div>
        </div>
      </div>
    );
  }
}

NavBar.propTypes = propTypes;
NavBar.defaultProps = defaultProps;
export default withShortcutHelper(withModalMounter(injectIntl(NavBar)), 'toggleUserList');
