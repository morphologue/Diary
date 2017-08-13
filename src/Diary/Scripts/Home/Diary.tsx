import React = require('react');
import TinyMCE = require('react-tinymce');

// Make TinyMCE work with Webpack, ergh :(
import 'tinymce/tinymce';
import 'tinymce/themes/modern';
(require as any).context(
    'file-loader?name=[path][name].[ext]&context=node_modules/tinymce!tinymce/skins',
    true,
    /.*/
);

export = function MyTiny(props: any) {
    return <TinyMCE />;
}
