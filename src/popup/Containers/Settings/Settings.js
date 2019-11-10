import { TextInput, Toggle } from '../../Components';
import { state, updateState } from '../../../store';

const Settings = () => ({
  view: () => (
    <div>
      <Toggle
        title={browser.i18n.getMessage('titleDisableSuspension')}
        checked={state()['#input-disable-suspension']}
        onchange ={e => updateState({ '#input-disable-suspension': e.target.checked })}
        onText={browser.i18n.getMessage('toggleDisableSuspensionOn')}
        offText={browser.i18n.getMessage('toggleDisableSuspensionOff')}
        purpose="warning"
      />
      <TextInput
        prepend={(<span className="input-group-text">{browser.i18n.getMessage('titleDelaySuspend')}</span>)}
        value={state()['#input-delay-suspend']}
        onchange={e => updateState({ '#input-delay-suspend': e.target.value })}
        pattern="[0-9]{1,6}"
      />
      <Toggle
        title={browser.i18n.getMessage('titleIgnoreAudible')}
        checked={state()['#input-ignore-audible']}
        onchange={e => updateState({ '#input-ignore-audible': e.target.checked })}
        purpose="secondary"
      />
      <Toggle
        title={browser.i18n.getMessage('titleIgnorePinned')}
        checked={state()['#input-ignore-pinned']}
        onchange={e => updateState({ '#input-ignore-pinned': e.target.checked })}
        purpose="secondary"
      />
      <TextInput
        prepend={(<span className="input-group-text">{browser.i18n.getMessage('titleSuspendThreshold')}</span>)}
        value={state()['#input-suspend-threshold']}
        onchange={e => updateState({ '#input-suspend-threshold': e.target.value })}
        pattern="[0-9]{1,4}"
      />
    </div>
  ),
});

export default Settings;
