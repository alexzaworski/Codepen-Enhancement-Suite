import CESModule from './core/CESModule';
import dom from '../utils/dom';
import messenger from '../utils/messenger';
import storage from '../utils/storage';
import initData from '../utils/initData';

export default class HideProfileCSS extends CESModule {
  constructor () {
    super();
    this.conditions = {
      isPage: ['profile']
    };
  }

  go () {
    storage.get('disabledProfiles')
    .then(profiles => new Set(profiles))
    .catch(() => new Set())
    .then((profiles) => this.initWithProfiles(profiles));
  }

  initWithProfiles (profiles) {
    this.disabledProfiles = profiles;
    this.profile = initData.__profiled.username;
    this.style = dom.get('style');
    this.head = dom.get('head');
    if (this.isDisabled()) {
      this.removeStyle();
    }
    this.addRuntimeListeners();
  }

  addRuntimeListeners () {
    messenger.on('disable-profile-css', (isDisabled) => {
      if (isDisabled) {
        this.removeStyle();
        this.addToDisabledProfiles();
      } else {
        this.appendStyle();
        this.removeFromDisabledProfiles();
      }
    });

    messenger.on('popup-toggle-ready', () => {
      messenger.send('profile-css-data', this.isDisabled());
    });
  }

  removeFromDisabledProfiles () {
    this.disabledProfiles.delete(this.profile);
    this.saveProfilesToStorage();
  }

  addToDisabledProfiles () {
    this.disabledProfiles.add(this.profile);
    this.saveProfilesToStorage();
  }

  isDisabled () {
    return this.disabledProfiles.has(this.profile);
  }

  saveProfilesToStorage () {
    storage.set('disabledProfiles', [...this.disabledProfiles]);
  }

  removeStyle () {
    this.style.remove();
  }

  appendStyle () {
    this.head.append(this.style);
  }

}
