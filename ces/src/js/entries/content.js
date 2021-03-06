import loadCSS from 'js/utils/loadCSS';
import ensureSyncStorage from 'js/utils/ensureSyncStorage';

import CES from 'js/modules/core/CES';

import ResizablePreviews from 'js/modules/resizablePreviews';
import HideProfileCSS from 'js/modules/hideProfileCSS';
import DistractionFreeMode from 'js/modules/distractionFreeMode';
import ProfilePreviews from 'js/modules/profilePreviews';
import CustomTheme from 'js/modules/customTheme';
import PatchNotes from 'js/modules/patchNotes';

loadCSS('content');

CES.registerModule(ResizablePreviews);
CES.registerModule(HideProfileCSS);
CES.registerModule(DistractionFreeMode);
CES.registerModule(ProfilePreviews);
CES.registerModule(CustomTheme);
CES.registerModule(PatchNotes);

ensureSyncStorage().then(() => CES.initModules());
