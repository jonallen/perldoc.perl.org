#! /usr/bin/perl

use strict;
use warnings;
use FindBin qw/$Bin/;
use lib "$Bin/lib";
use Perldoc::Page;
use Perldoc::Section;


#--------------------------------------------------------------------------

print "function loadModuleIndex() {\n";

foreach my $page (Perldoc::Section::pages('pragmas'), grep {/^[A-Z]/} (Perldoc::Page::list())) {
  if (my $title = Perldoc::Page::title($page)) {
    #s/\W/-/g;
    $title =~ s/\\/\\\\/g;
    $title =~ s/"/\\"/g;
    $title =~ s/C<(.*?)>/$1/g;
    $title =~ s/\n//sg;
    print qq{  moduleList["$page"]="$title";\n};
  }
}
print "}\n";
