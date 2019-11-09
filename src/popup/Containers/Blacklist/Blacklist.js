import { ControlledList, Toggle } from '../../Components';
import { state, updateState } from '../../../store';

const Blacklist = () => {
  const updateEntries = (newEntries) => {
    updateState({ '#input-blacklist-pattern': new Set(newEntries) });
  };

  return {
    view: () => (
      <div>
        <Toggle
          title={browser.i18n.getMessage('titleEnableBlacklist')}
          checked={state()['#input-enable-blacklist']}
          onchange={e => updateState({ '#input-enable-blacklist': e.target.checked })}
          purpose="secondary"
        />
        <div class="mb-4">
          {browser.i18n.getMessage('blacklistDescription')}
          <code>\regex\</code>
        </div>
        <ControlledList
          entries={[ ...state()['#input-blacklist-pattern'] ]}
          updateEntries={updateEntries}
        />
      </div>
    ),
  };
};

export default Blacklist;
