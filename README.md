# md-link-title.vim

`md-link-title.vim` is a Vim extension built using the denops framework. It automatically fetches the title of a webpage pointed to by a raw URL in Markdown format and replaces the URL with a formatted Markdown link.

## Features

1. Automatically replaces raw URLs with Markdown links containing the webpage titles on InsertLeave event at the last edited location in a `*.md` or `*.mdx` file.
2. Provides a command `:MdLinkTitleToggleAutoReplace` to toggle the auto-replacement feature.
3. Provides a command `:MdLinkTitleReplace` to manually replace raw URLs with Markdown links in the selected range.

## Installation

Make sure you have [denops.vim](https://github.com/vim-denops/denops.vim) installed.

Using your preferred Vim plugin manager, add this plugin to your `vimrc` or `init.vim`:

```vim
" vim-plug
Plug 'wbelucky/md-link-title.vim'
Plug 'vim-denops/denops.vim'
```

```lua
-- lazy.nvim
{
  "wbelucky/md-link-title.vim",
  lazy = false, -- TODO:
  dependencies = { "vim-denops/denops.vim" },
}
```

## Configuration

This extension currently does not support configuration options. Feel free to fork the repository and customize it to suit your needs.

## License

This project is licensed under the MIT License

## Acknowledgments

- Thanks to the creators and maintainers of the denops framework for making Vim plugin development easier.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
