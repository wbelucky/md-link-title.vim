function md_link_title#replace() range abort
  call denops#notify("md-link-title", "replace", [a:firstline, a:lastline])
endfunction

function md_link_title#set_global(dict) abort
  call denops#notify("md-link-title", "setup", [dict])
endfunction
