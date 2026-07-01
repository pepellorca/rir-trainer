import { copyFile, access, mkdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';

const targetDir = path.resolve('ios/App/App');
const files = [
  ['native-assets/rest-complete.wav', 'rest-complete.wav'],
  ['native-assets/PrivacyInfo.xcprivacy', 'PrivacyInfo.xcprivacy'],
];
try {
  await access(targetDir, constants.F_OK);
  await mkdir(targetDir, { recursive: true });
  for (const [source, name] of files) {
    await copyFile(path.resolve(source), path.join(targetDir, name));
  }
  console.log('✓ Sonido y manifiesto de privacidad copiados al proyecto iOS.');
  console.log('ℹ En Xcode comprueba que ambos archivos tengan marcado el target App.');
} catch {
  console.log('ℹ Proyecto iOS aún no creado; los recursos se copiarán después de npm run cap:add:ios.');
}
