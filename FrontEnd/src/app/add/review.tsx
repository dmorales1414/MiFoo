// Route "/add/review". Loaded lazily because it uses the native date picker.
import { lazyScreen } from '../../utils/lazyScreen';

export default lazyScreen(() => require('../../screens/add/ReviewItemScreen'));
