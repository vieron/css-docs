# THIS REPO HAS BEEN MOVED TO [vieron/ui-docs](https://github.com/vieron/ui-docs/)


# css-docs

CSS Styleguide Generator focused on CSS Modular Architectures and written in Javascript.

css-docs is a **WORK IN PROGRESS** but you can see a [demo here](http://vieron.github.io/css-docs/)


## Features

- Dynamic @directives
- @state and @modifier directives
- @extends and @depends directives
- Supports Custom templates
- Focused on Modular CSS Architectures
- Use Markdown in descriptions
- Write less markup using Handlebars helpers
- Give some hierarchy to your CSS using dot paths
- One single HTML page for each component
- Works with any CSS-preprocessing language or with CSS directly
- Easily extendible. Custom translators for each @directive.


## Installation

    $ npm install css-docs


## Usage

**css-docs** is a node package, you can write a small `.js` file and run it from
the command line. See [example/css-docs.js](example/css-docs.js)

Or if you are using [Grunt](http://gruntjs.com), there is a css-docs grunt plugin
[here](https://github.com/vieron/grunt-css-docs).


## Example


```css
/**
 * Icon
 * Lorem ipsum Non do id tempor laboris do ut veniam in sint fugiat fugiat
 * adipisicing elit Excepteur.
 *
 * @modifier .Ico-edit Lorem ipsum dolor sit amet
 * @modifier .Ico-settings Lorem ipsum dolor sit amet
 *
 * @markup
 * <i class="Ico {{classes}}"></i>
 *
 * @styleguide components.icon
 */
```

```css
/**
 * Button
 * Lorem ipsum Non do id tempor laboris do ut veniam in sint fugiat fugiat
 * adipisicing elit Excepteur.
 *
 * @state :hover
 * @state .js-isDisabled Lorem ipsum dolor sit amet
 *
 * @modifier .btn--success Lorem ipsum dolor sit amet
 * @modifier .btn--cancel Lorem ipsum dolor sit amet
 *
 * @depends component.icon
 * @depends component.foo
 *
 * @extends component.link
 *
 * @markup
 * <a class="button {{classes}}">Button</a>
 *
 * @markup
 * <button class="button {{classes}}">Button</button>
 *
 * @markup
 * <a class="button {{classes}}">
 *     {{use 'components.icon Ico--edit'}}
 *     <span>Button</span>
 * </a>
 *
 * @styleguide components.button
 */
 ```

 ```css
 /**
  * Button Group
  * Lorem ipsum Non do id tempor laboris do ut veniam in sint fugiat fugiat
  * adipisicing elit Excepteur.
  *
  * @modifier .BtnGroup--compact Lorem ipsum dolor sit amet
  * @modifier .BtnGroup--fullWidth Lorem ipsum dolor sit amet
  *
  * @depends component.button
  *
  * @markup
  * <div class="BtnGroup {{classes}}">
  *     {{#repeat 4}}
  *         {{use 'components.button'}}
  *     {{/repeat}}
  * </div>
  *
  * @styleguide components.buttonGroup
  */
```


## Options

| Name                 | Type               | Default                                         | Description
|:-------------        |:-------------      |:-----                                           |:---------------
| **title**            | `String`           | `'css-docs'`                                    | Title used in the generated Docs
| **logo**             | `String/Boolean`   | `false`                                         | If it's a String is used as src attribute of an image tag. It replaces title.
| **docsPath**         | `String`           | `'docs/'`                                       | Path where generated Docs are placed
| **docsAssetsPath**   | `String`           | `'docs/assets/css-docs/'`                       | Path where theme assets are copied to use in generated Docs
| **styleDir**         | `String`           | `'assets/sass/'`                                | Path where your project CSS/sass/less files are located.
| **styleFileExt**     | `Array`            | `['.scss', '.css', '.sass', '.styl', '.less']`  | Valid file extensions to search for comments. Used by `styleDir`.
| **ignore**           | `Array`            | `['**/bourbon/**']`                             | Ignore files to be parsed. Uses [multimatch](https://github.com/sindresorhus/multimatch)
| **builtAssetsDir**   | `String`           | `'assets/'`                                     | Your project assets (images, fonts, javascripts). That are copied to `docsPath + '/assets'`.
| **builtCSSPath**     | `String`           | `'css/built.css'`                               | Path to the compiled, concatenated, mininified... CSS. Relative to `builtAssetsDir`.


## Doc block variables (for templating)

- title (first line of description)
- description
- name (one word, from styleguide)
- modifier
    - classes
    - name
    - description
- state
    - classes
    - name
    - description
- depends
- depends_html
- extends
- depends_html
- usage
- markup
- markup_highlighted
- styleguide (components.button)

- line
- filePath (sass/ducksboard.scss)
- absoluteFilePath (/Users/vieron/code/projects/css-docs/example/sass/ducksboard.scss)
- treePath (components.childs.button)


## Development

Checkout the project and go to:

    $ git clone git@github.com:vieron/css-docs.git
    $ cd css-docs/example
    $ git clone git@github.com:vieron/css-docs.git docs
    $ cd docs
    $ git checkout gh-pages


Compile example sass

    $ cd example
    $ sass --watch assets/sass/ducksboard.scss:assets/css/built.css

Generate docs

    $ node css-docs.js


## TO-DO

* refactor
* error reporting
* write tests
* @experimental and @deprecated directive
* @index directive to render TOC
* option to generate a JSON representation instead of generate HTML docs
* copy code snippet (zeroclipboard)
