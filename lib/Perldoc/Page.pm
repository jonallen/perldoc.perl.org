package Perldoc::Page;

use strict;
use warnings;
use Carp;
use Module::CoreList;
use Perldoc::Config;
use Pod::Simple::Search;

use constant TRUE  => 1;
use constant FALSE => 0;

our $VERSION = '0.01';


#--------------------------------------------------------------------------

our %CoreList = (
                  'ExtUtils::MakeMaker::FAQ'      => undef,
                  'ExtUtils::MakeMaker::Tutorial' => undef,
                );
%CoreList = (%CoreList,%{$Module::CoreList::version{$]*1}});

my $search = Pod::Simple::Search->new->inc(FALSE)->laborious(TRUE);
#warn "Perldoc::Page searching for Pod";
my $n2p    = $search->survey(
                  (grep {$_ !~ /site|vendor/ && $_ !~ /^\.$/ && $_ =~ /$Perldoc::Config::option{perl_version}/} expand(@{$Perldoc::Config::option{inc}})),
                  expand($Perldoc::Config::option{bin}),
                 # map {"$Perldoc::Config::option{perl_source}/$_"} qw/ext lib pod/
                );

#my $n2p = $search->survey(map {"/Users/jj/perl/src/perl-5.8.8/$_"} qw/ext lib pod/); 
                
our %name2path = map {
                   my $path = $n2p->{$_};
                   s/^pods:://;
                   ($_,$path) 
                 } grep {
		   $_ !~ /perltoc|perlcn|perljp|perlko|perltw/
		 } keys %$n2p;
                 
foreach my $pod (keys %name2path) {
  next if (exists($CoreList{$pod}));
  my $original_pod = $pod;
  SEARCH: while ($pod =~ s/^\w+::(.*)/$1/) {
    if (exists($CoreList{$pod}) && !exists($name2path{$pod})) {
      $name2path{$pod} = $name2path{$original_pod};
      delete $name2path{$original_pod};
      last SEARCH;
    }
  }
}                 

our %name2title;
our %name2pod;


#--------------------------------------------------------------------------

sub list {
  return keys %name2path;
}


#--------------------------------------------------------------------------

sub exists {
  my $page = shift;
  return exists $name2path{$page};
}


#--------------------------------------------------------------------------

sub pod {
  my $page = shift;
  unless (exists $name2pod{$page}) {
    local $/ = undef;
    open POD,'<',Perldoc::Page::filename($page) or confess("Cannot open POD for $page");
    my $pod = (<POD>);
    $pod =~ s/\r//g;
    $name2pod{$page} = $pod;
    close POD;
  }
  return $name2pod{$page};
}


#--------------------------------------------------------------------------

sub filename {
  my $page = shift;
  return $name2path{$page};
}


#--------------------------------------------------------------------------

sub title {
  my $page = shift;
  unless (exists $name2title{$page}) {
    local $_ = Perldoc::Page::pod($page);
    if (/=head1 NAME\s*?[\n|\r](\S.*?)[\n|\r]\s*[\n|\r]/si or 
        /=head1 TITLE\s*?[\n|\r](\S.*?)[\n|\r]\s*[\n|\r]/si) {
      my $title = $1;
      if (defined $title) {
        $title =~ s/E<(.*?)>/&$1;/g;
        $title =~ s/[A-DF-Z]<(.*?)>/$1/g;
        $title =~ s/.*? -+\s+//;
        $title =~ s/\(\$.*?\$\)//;
        $name2title{$page} = $title;
      }
    }
  }
  return $name2title{$page};
}


#--------------------------------------------------------------------------

sub expand {
  my @dirs = @_;
  map { s/^~/$ENV{HOME}/ } @dirs;
  return @dirs;
}


#--------------------------------------------------------------------------

1;
