# css-docs

CSS Styleguide Generator focused on CSS Modular Architectures and written in Javascript.


## Features

- Focused on CSS Modular Architectures
- Supports Custom templates
- Works with any CSS-preprocessing language or with CSS directly
- Easily extendible
    - Custom translators for each @directive
    - Use @whateveryouwant directive and will be exposed to the template


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



## Spec


```css
/**
 * Button
 * Lorem ipsum Non do id tempor laboris do ut veniam in sint fugiat fugiat
 * adipisicing elit Excepteur.
 *
 * @state :hover
 * @state .js-isActive Lorem ipsum dolor sit amet
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
 * @styleguide components.button
 */
```


## Development

Compile example sass

    $ cd example
    $ sass --watch assets/sass/ducksboard.scss:assets/css/built.css

Generate docs

    $ node css-docs.js



## TO-DO

* breadcrumbs, remove link in no generated pages
* copy code snippet (zeroclipboard)
* refactor
* grunt plugin