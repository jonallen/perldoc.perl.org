#! /usr/bin/perl

use strict;
use warnings;
use FindBin qw/$Bin/;
use lib "$Bin/lib";
use Perldoc::Page;
use Perldoc::Section;


#--------------------------------------------------------------------------

print "function loadPodIndex() {\n";

foreach my $section (grep {$_ ne 'pragmas'} (Perldoc::Section::list())) {
  my $section_name = Perldoc::Section::name($section);
  print qq{  sectionName["$section"]="$section_name";\n};
  foreach my $page (Perldoc::Section::pages($section)) {
    my $title = Perldoc::Page::title($page);
    #s/\W/-/g;
    $title =~ s/\\/\\\\/g;
    $title =~ s/"/\\"/g;
    $title =~ s/C<(.*?)>/$1/g;
    $title =~ s/\n//sg;
    print qq{  podList["$page"]=["$section","$title"];\n};
  }
}
print "}\n";
