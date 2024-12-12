# Yong Cheng - AcadHomepage

**_sass/_sidebar.scss**
```
.author__avatar {
  display: table-cell;
  vertical-align: top;
  width: 75px;
  // set width only, for non-square avatars
  height: 75px;

  @include breakpoint($large) {
    display: block;
    width: auto;
    height: auto;
  }

  img {
    max-width: 175px;
    min-width: 75px;
    border-radius: 0%;//50%;

    @include breakpoint($large) {
      padding: 0px;
      border: 1px solid $border-color;
    }
  }
}
```
Change border-radius from 50% to 0%

## Change the font color of navigation
**_sass/_navigation.scss**
```
.greedy-nav{
  color:#fff
}
```
**_sass/_variables.scss**
Change primary-color from #7a8288 to #fff

**_sass/_forms.scss**
line 89
Change border-color: mix(#fff, $primary-color, 50%) to border-color: mix(#7a8288, $primary-color, 50%)

## Change the background color of navigation
**_sass/_navigation.scss**
line 178
```
.greedy-nav{
  background: #0D4994;//$background-color;
}
```
**_sass/_masthead.scss**
line 8
```
.masthead {
  background-color: #0D4994;//white;
}
```

## Change the body font color
**_sass/_variables.scss**
Change $text-color from $dark-gray to #000

## To make the link open in a new tab
**_includes/masthead.html**
```
<li class="masthead__menu-item">
    <a href="{{ domain }}{{ link.url }}" target="_blank">{{ link.title }}</a>
</li>
```
Adding target="_blank" ensures that the link will open in a new tab or window.
