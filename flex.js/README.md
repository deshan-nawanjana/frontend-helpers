# Flex: Responsive Layout Handling

- [Installation](#installation)
- [Device Selection](#device-selection)
    - [Root Element](#root-element)
    - [Visibility](#visibility)
- [Rows & Columns](#rows--columns)
- [Style Switching](#style-switching)

## Installation

Flex module can be installed by adding the [script](./flex.js) file with its [stylesheet](./flex.css) into head section of the web page. Script will be initiated and fetch all flex elements of the document to start the responsive rendering.

```HTML
<link rel="stylesheet" href="./flex.css">
<script src="./flex.js"></script>
```

## Device Selection

Following devices are the keywords for specifying the flexing elements and styles. It can be a device type or screen orientation.

```
desktop
tablet
mobile
horizontal
vertical
```

### Root Element

While web page is rendering and resizing, Root element of the page will hold the `device-type` attribute the specify the current selection from above list of devices. Sothe device type will be identified by its type and screen orientation. This attribute will update it self and you may able to use it on your style rules anytime.

```HTML
<!-- screen is in vertical mode and simillar to a mobile device -->
<html lang="en" device-type="mobile vertical">
<!-- screen is in horizontal mode and simillar to a tablet device -->
<html lang="en" device-type="tablet horizontal">
<!-- screen is in vertical mode and simillar to a desktop device -->
<html lang="en" device-type="desktop vertical">
```

Use of `device-type` can be rare but possible.

```CSS
/* for desktop version */
[device-type*="desktop"] .title { font-weight: 600; }
/* for mobile version */
[device-type*="mobile"] .title { font-weight: 500; }
```

### Visibility

Visibility of an element or part of a document can be switched according to device type using `visible` attribute. Mainly you can use a `<flex>` element to do this.

```HTML
<flex visible="mobile tablet vertical">
    This text shows for mobile or tablet devices
    with vertical screen orientation only
</flex>
```

Or you can use any other element with `flex` attribute to define it's as a flex element and that element also will be following the same rule.

```HTML
<h1 flex visible="mobile tablet vertical">
    My Heading Text
</h1>
```

## Rows & Columns

Using `rows`, `cols` and `reverse` attributes you can design complex flex layouts switching between various devices and orientations. Defining `rows` with no value represents row direction layout for any devices. This works same for the `cols` attribute as well.

```HTML
<!-- columns direction layout -->
<flex rows>
    <div>1</div>
    <div>2</div>
    <div>3</div>
</flex>

<!-- rows direction layout -->
<flex rows>
    <div>a</div>
    <div>b</div>
    <div>c</div>
</flex>
```

You can set devices for these attributes and make it flexible.

```HTML
<!-- switch layout direction by device -->
<flex rows="desktop tablet" cols="mobile">
    <div>1</div>
    <div>2</div>
    <div>3</div>
</flex>
```

`reverse` attribute is used to reverse the layout elements.

```HTML
<!-- reverse layout in horizontal mode -->
<flex rows reverse="horizontal">
    <div>1</div>
    <div>2</div>
    <div>3</div>
</flex>
```

These attribute can be used for any complex layout design to switch between devices easily.

```HTML
<flex rows="desktop tablet" cols="mobile">
    <div>1</div>
    <div>2</div>
    <div>
        <flex cols="vertical" reverse="horizontal">
            <div>a</div>
            <div>b</div>
            <div>c</div>
        </flex>
    </div>
</flex>
```

## Style Switching

Style tags or external stylesheets can be switched according to device or orientation by defining `flex` attribute on `style` or `link` elements.

```HTML
<!-- only available in mobile or vertical screens -->
<link rel="stylesheet" href="./mobile.css" flex="mobile vertical">

<!-- only available in desktop mode -->
<style flex="desktop">
    .title { color: red; }
</style>
```