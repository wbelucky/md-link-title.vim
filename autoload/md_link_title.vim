function md_link_title#replace(_firstline, _lastline) abort
  call denops#notify("md-link-title", "replace", [a:_firstline, a:_lastline])
endfunction

function md_link_title#set_global(dict) abort
  call denops#notify("md-link-title", "setup", [dict])
endfunction
