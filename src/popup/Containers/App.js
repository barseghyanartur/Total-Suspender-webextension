import { Card, TabsList } from '../Components';
import Settings from './Settings';
import Actions from './Actions';
import Whitelist from './Whitelist';
import Blacklist from './Blacklist';
import Experimental from './Experimental';
import '../index.scss';

const App = {
  view: () => (
    <Card
      title="Total Suspender"
      styles={ { cardContainer: 'options_card' } }
    >
      <TabsList
        tabs={[
          { id: 'Settings', title: browser.i18n.getMessage('titleSettings'), render: () => <Settings /> },
          { id: 'Actions', title: browser.i18n.getMessage('titleActions'), render: () => <Actions /> },
          { id: 'Whitelist', title: browser.i18n.getMessage('titleWhitelist'), render: () => <Whitelist /> },
          { id: 'Blacklist', title: browser.i18n.getMessage('titleBlacklist'), render: () => <Blacklist /> },
          { id: 'Experimental', title: browser.i18n.getMessage('titleExperimental'), render: () => <Experimental />}
        ]}
      />
    </Card>
  ),
};

export default App;
