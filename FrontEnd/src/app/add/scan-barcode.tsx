// Route "/add/scan-barcode". Loaded lazily because it uses the camera (native code).
import { lazyScreen } from '../../utils/lazyScreen';

export default lazyScreen(() => require('../../screens/add/ScanBarcodeScreen'));
