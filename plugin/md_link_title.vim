command! -nargs=0 -range MdLinkTitleReplace call md_link_title#replace(<line1>,<line2>)

command! -nargs=0 MdLinkTitleToggleAutoReplace call s:toggleAutoReplace()

function! s:insertLeaveCb() abort
  let firstline = line("'[")
  let lastline = line("']")
  call md_link_title#replace(firstline,lastline)
endfunction

function! s:toggleAutoReplace() abort
  if exists('#MdLinkTitle#InsertLeave')
    augroup MdLinkTitle
      autocmd!
    augroup END
  else
    augroup MdLinkTitle
      autocmd!
      autocmd InsertLeave *.md,*.mdx call s:insertLeaveCb()
    augroup END
  endif
endfunction

" call s:toggleAutoReplace()
