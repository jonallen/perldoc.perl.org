#! /usr/bin/perl

use strict;
use warnings;
use FindBin qw/$Bin/;
use Pod::POM;
use Pod::POM::View::Text;

use lib "$Bin/lib";
use Perldoc::Page;


#--------------------------------------------------------------------------

print "function loadFaqIndex() {\n";
my $found = 0;
foreach my $section (1..9) {
  my $pod    = Perldoc::Page::pod("perlfaq$section");
  my $parser = Pod::POM->new();
  my $pom    = $parser->parse_text($pod);

  foreach my $head1 ($pom->head1) {
    foreach my $head2 ($head1->head2) {
      my $title = $head2->title->present('Pod::POM::View::Text');
      $title =~ s/\n/ /g;
      $title =~ s/\\/\\\\/g;
      $title =~ s/"/\\"/g;
      print qq{  faqList[$found]=[$section,"$title"];\n};
      $found++;
    }
  }

#   foreach (Perldoc::Page::pod("perlfaq$section") =~ /=head2 (.*)$/mg) {
#     #s/\W/-/g;
#     s/\\/\\\\/g;
#     s/"/\\"/g;
#     s/C<(.*?)>/$1/g;
#     print qq{  faqList[$found]=[$section,"$_"];\n};
#     $found++;
#   }
}
print "}\n";
