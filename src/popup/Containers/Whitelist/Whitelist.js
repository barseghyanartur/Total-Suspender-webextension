import { Toggle, ControlledList } from '../../Components';
import { state, updateState } from '../../../store';

const Whitelist = () => {
  const updateEntries = (newEntries) => {
    updateState({ '#input-whitelist-pattern': new Set(newEntries) });
  };

  return {
    view: () => (
      <div>
        <Toggle
          title={browser.i18n.getMessage('titleEnableWhitelist')}
          checked={state()['#input-enable-whitelist']}
          onchange={e => updateState({ '#input-enable-whitelist': e.target.checked })}
          purpose="secondary"
        />
        <div class="mb-4">
          {browser.i18n.getMessage('whitelistDescription')}
          <code>\regex\</code>
        </div>
        <ControlledList
          entries={[ ...state()['#input-whitelist-pattern'] ]}
          updateEntries={updateEntries}
        />
      </div>
    ),
  };
};

export default Whitelist;
