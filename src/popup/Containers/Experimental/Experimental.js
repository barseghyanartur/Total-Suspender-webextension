import { TextInput, Toggle } from '../../Components';
import { state, updateState } from '../../../store';

const Experimental = () => ({
  view: () => (
    <div>
      <Toggle
        title={browser.i18n.getMessage('titleEnableExperimental')}
        checked={state()['#input-enable-experimental']}
        onchange={e => updateState({ '#input-enable-experimental': e.target.checked })}
        purpose="warning"
      />
      <fieldset
        disabled={!state()['#input-enable-experimental']}
        hidden={!state()['#input-enable-experimental']}
      >
        <Toggle
          title={browser.i18n.getMessage('titleConfirmReload')}
          checked={state()['#input-confirm-reload']}
          onchange={e => updateState({ '#input-confirm-reload': e.target.checked })}
          purpose="secondary"
        />
        <Toggle
          title={browser.i18n.getMessage('titleShouldChangeIcon')}
          checked={state()['#input-should-change-icon']}
          onchange={e => updateState({ '#input-should-change-icon': e.target.checked })}
          purpose="secondary"
        />
        <TextInput
          prepend={(<span className="input-group-text">{browser.i18n.getMessage('titleDotColor')}</span>)}
          value={state()['#input-dot-color']}
          onchange={e => updateState({ '#input-dot-color': e.target.value })}
          pattern="#([0-9a-fA-F]{3}){1,2}"
        />
        <Toggle
          title={browser.i18n.getMessage('titleShouldChangeTitle')}
          checked={state()['#input-should-change-title']}
          onchange={e => updateState({ '#input-should-change-title': e.target.checked })}
          purpose="secondary"
        />
        <TextInput
          prepend={(<span className="input-group-text">{browser.i18n.getMessage('titlePrependText')}</span>)}
          value={state()['#input-prepend-text']}
          onchange={e => updateState({ '#input-prepend-text': e.target.value })}
        />
      </fieldset>
    </div>
  ),
});

export default Experimental;
