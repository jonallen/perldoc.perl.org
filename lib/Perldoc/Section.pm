package Perldoc::Section;

use strict;
use warnings;
use Perldoc::Page;

our $VERSION = '0.01';


#--------------------------------------------------------------------------

our @section_data = (
  { 
    id    => 'overview',
    name  => 'Overview',
    pages => [qw/perl perlintro perlrun perlbook perlcommunity/] 
  },
  {
    id    => 'tutorials',
    name  => 'Tutorials',
    pages => [qw/perlreftut perldsc perllol perlrequick
                 perlretut perlboot perltoot perltooc perlbot
                 perlstyle perlcheat perltrap perldebtut
                 perlopentut perlpacktut perlthrtut perlothrtut
                 perlxstut perlunitut perlpragma/]
  },
  {
    id        => 'faq',
    name      => 'FAQs',
    lastpages => [qw/perlunifaq/],
    pagematch => qr/^perlfaq/,
    sort      => sub {$a cmp $b}
  },
  {
    id    => 'language',
    name  => 'Language reference',
    pages => [qw/perlsyn perldata perlsub perlop
                 perlfunc perlpod perlpodspec perldiag
                 perllexwarn perldebug perlvar perlre
                 perlreref perlrebackslash perlrecharclass perlref perlform perlobj perltie
                 perldbmfilter perlipc perlfork perlnumber
                 perlperf perlport perllocale perluniintro perlunicode perluniprops
                 perlebcdic perlsec perlmod perlmodlib
                 perlmodstyle perlmodinstall perlnewmod
                 perlcompile perlfilter perlglossary CORE
                 /]
  },
  {
    id    => 'internals',
    name  => 'Internals and C language interface',
    pages => [qw/perlembed perldebguts perlxs perlxstut perlrepository
                 perlclib perlguts perlcall perlapi perlintern perlmroapi
                 perliol perlapio perlhack perlreguts perlreapi perlpolicy/]
  },
  { 
    id        => 'history',
    name      => 'History / Changes',
    pages     => [qw/perlhist perltodo perldelta/],
    pagematch => qr/^perl\d+delta$/,
    sort      => sub {
                   (my $c = $a) =~ s/.*?(\d{2,}).*/_perldelta_version_to_numeric("$1")/e;
                   (my $d = $b) =~ s/.*?(\d{2,}).*/_perldelta_version_to_numeric("$1")/e;
                   $d <=> $c
                 }
  },
  {
    id    => 'licence',
    name  => 'Licence',
    pages => [qw/perlartistic perlgpl/]
  },
  {
    id    => 'platforms',
    name  => 'Platform specific',
    pages => [qw/perlaix perlamiga perlapollo perlbeos perlbs2000
                 perlce perlcygwin perldgux perldos perlepoc
                 perlfreebsd perlhaiku perlhpux perlhurd perlirix perllinux
                 perlmachten perlmacos perlmacosx perlmint perlmpeix
                 perlnetware perlopenbsd perlos2 perlos390 perlos400
                 perlplan9 perlqnx perlriscos perlsolaris perlsymbian perltru64 perluts
                 perlvmesa perlvms perlvos perlwin32/]
  },
  { 
    id        => 'pragmas',
    name      => 'Pragmas',
    pages     => [qw/attributes attrs autodie autouse base bigint bignum 
                     bigrat blib bytes charnames constant diagnostics
                     encoding feature fields filetest if integer less lib
                     locale mro open ops overload overloading parent re sigtrap sort strict
                     subs threads threads::shared utf8 vars vmsish
                     warnings warnings::register/]
  },
  {
    id        => 'utilities',
    name      => 'Utilities',
    pages     => [qw/perlutil a2p c2ph config_data corelist cpan cpanp
                     cpan2dist dprofpp enc2xs find2perl h2ph h2xs instmodsh
                     libnetcfg perlbug perlcc piconv prove psed podchecker
                     perldoc perlivp pod2html pod2latex pod2man pod2text
                     pod2usage podselect pstruct ptar ptardiff s2p shasum
                     splain xsubpp perlthanks/]
  }
);


#--------------------------------------------------------------------------

sub list {
  return map {$_->{id}} @section_data;
}


#--------------------------------------------------------------------------

sub name {
  my $section = shift;
  return (map {$_->{name}} (grep {$_->{id} eq $section} @section_data))[0];
}


#--------------------------------------------------------------------------

sub pages {
  my $section = shift;
  my @pages;
  if (my $section_data = (grep {$_->{id} eq $section} @section_data)[0]) {
    if ($section_data->{pages}) {
      push @pages, @{$section_data->{pages}};
    }
    if ($section_data->{pagematch}) {
      my @matched_pages = grep {$_ =~ $section_data->{pagematch}} Perldoc::Page::list();
      if (my $sortsub = $section_data->{sort}) {
        @matched_pages = sort $sortsub @matched_pages;
      }
      push @pages, @matched_pages;
    }
    if ($section_data->{lastpages}) {
      push @pages, @{$section_data->{lastpages}};
    }
  }
  return grep {Perldoc::Page::exists($_)} @pages;
}


#--------------------------------------------------------------------------

sub _perldelta_version_to_numeric {
  my $delta_version = shift;
  # 5005 -> 5.005
  # 56   -> 5.006
  # 561  -> 5.006001
  # 5101 -> 5.010001
  # 51010 -> 5.010010 (no such delta files currently)
  my ($revision, $version, $subversion) = $delta_version =~ /^(\d)0*(\d(?=\d?\z)|\d\d)(\d*)/;
  return sprintf('%d.%03d%03d', $revision, $version, $subversion || 0);
}


#--------------------------------------------------------------------------

1;
