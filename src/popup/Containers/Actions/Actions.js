import { Toggle } from '../../Components';
import { state, updateState } from '../../../store';

const Actions = () => ({
  view: () => (
    <div>
      <Toggle
        checked={state()['#input-suspend-planned']}
        onchange={e => updateState({ '#input-suspend-planned': e.target.checked })}
        offText={browser.i18n.getMessage('toggleSuspendPlannedOff')}
        onText={browser.i18n.getMessage('toggleSuspendPlannedOn')}
      />
      <Toggle
        checked={state()['#input-suspend-all-planned']}
        onchange={e => updateState({ '#input-suspend-all-planned': e.target.checked })}
        offText={browser.i18n.getMessage('toggleSuspendAllPlannedOff')}
        onText={browser.i18n.getMessage('toggleSuspendPlannedOn')}
      />
    </div>
  ),
});

export default Actions;
