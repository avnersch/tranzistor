const { withMainActivity } = require('expo/config-plugins');

const IMPORT_BUNDLE = 'import android.os.Bundle';
const IMPORT_CAST = 'import com.reactnative.googlecast.api.RNGCCastContext';

const ON_CREATE_BODY = `
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        try { RNGCCastContext.getSharedInstance(this) } catch (_: Exception) {}
    }`;

module.exports = function withCastActivity(config) {
  return withMainActivity(config, (mod) => {
    let contents = mod.modResults.contents;

    if (!contents.includes(IMPORT_BUNDLE)) {
      contents = contents.replace(
        /^(import .+)$/m,
        `$1\n${IMPORT_BUNDLE}`,
      );
    }

    if (!contents.includes(IMPORT_CAST)) {
      contents = contents.replace(
        IMPORT_BUNDLE,
        `${IMPORT_BUNDLE}\n${IMPORT_CAST}`,
      );
    }

    if (!contents.includes('RNGCCastContext')) {
      contents = contents.replace(
        /class MainActivity\s*:\s*ReactActivity\(\)\s*\{/,
        `class MainActivity : ReactActivity() {${ON_CREATE_BODY}`,
      );
    }

    mod.modResults.contents = contents;
    return mod;
  });
};
