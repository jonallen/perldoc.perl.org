#! /usr/bin/perl

use strict;
use warnings;
use Config;
use File::Basename;
use File::Path;
use File::Spec::Functions;
use FindBin qw/$Bin/;
use Getopt::Long;
use Template;

use lib "$Bin/lib";
use Perldoc::Config;
use Pod::POM;
use Pod::POM::View::Text;

use constant TRUE  => 1;
use constant FALSE => 0;


#--Set options for Template::Toolkit---------------------------------------

use constant TT_INCLUDE_PATH => "$Bin/templates";


#--Set config options------------------------------------------------------

my %specifiers = (
  'output-path' => '=s',
  'perl'        => '=s',
);              
my %options;
GetOptions( \%options, optionspec(%specifiers) );


#--Check mandatory options have been given---------------------------------

my @mandatory_options = qw/ output-path /;

foreach (@mandatory_options) {
  (my $option = $_) =~ tr/-/_/;
  unless ($options{$option}) {
    die "Option '$_' must be specified!\n";
  }
}


#--Check the output path exists--------------------------------------------

unless (-d $options{output_path}) {
  die "Output path '$options{output_path}' does not exist!\n";
}

$Perldoc::Config::option{output_path}  = $options{output_path};


#--Check if we are using a different perl----------------------------------

if ($options{perl}) {
  #warn "Setting perl to $options{perl}\n";
  my $version_cmd  = 'printf("%vd",$^V)';
  my $perl_version = `$options{perl} -e '$version_cmd'`;
  my $inc_cmd      = 'print "$_\n" foreach @INC';
  my $perl_inc     = `$options{perl} -e '$inc_cmd'`;
  my $bin_cmd      = 'use Config; print $Config{bin}';
  my $perl_bin     = `$options{perl} -e '$bin_cmd'`;
  
  $Perldoc::Config::option{perl_version}  = $perl_version;
  $Perldoc::Config::option{perl5_version} = substr($perl_version,2);
  $Perldoc::Config::option{inc}           = [split /\n/,$perl_inc];
  $Perldoc::Config::option{bin}           = $perl_bin;
  
  #warn Dumper(\%Perldoc::Config::option);
}


eval <<EOT;
use Perldoc::Function;
use Perldoc::Function::Category;
use Perldoc::Page;
use Perldoc::Section;  
EOT


#--Create indexPod.js------------------------------------------------------

my @pods;
foreach my $section (Perldoc::Section::list()) {
  next if $section eq 'pragmas';
  foreach my $page (Perldoc::Section::pages($section)) {
    my $title = Perldoc::Page::title($page) || warn "no title for $page";
    $title =~ s/\\/\\\\/g;
    $title =~ s/"/\\"/g;
    $title =~ s/C<(.*?)>/$1/g;
    $title =~ s/\n//sg;
    
    push @pods,{name=>$page, description=>$title};
  }
}

my $jsfile   = catfile($Perldoc::Config::option{output_path},'static','indexPod.js');
my $template = Template->new(INCLUDE_PATH => TT_INCLUDE_PATH);
$template->process('indexpod-js.tt',{%Perldoc::Config::option, pods=>\@pods},$jsfile) || die $template->error;


#--Create indexModules.js--------------------------------------------------

my @modules;
foreach my $page (Perldoc::Section::pages('pragmas'), grep {/^[A-Z]/} (Perldoc::Page::list())) {
  next unless exists($Perldoc::Page::CoreList{$page});
  if (my $title = Perldoc::Page::title($page)) {
    $title =~ s/\\/\\\\/g;
    $title =~ s/"/\\"/g;
    $title =~ s/C<(.*?)>/$1/g;
    $title =~ s/\n//sg;

    push @modules,{name=>$page, description=>$title};
  }
}

$jsfile = catfile($Perldoc::Config::option{output_path},'static','indexModules.js');
$template->process('indexmodules-js.tt',{%Perldoc::Config::option, modules=>\@modules},$jsfile) || die $template->error;


#--Create indexFunctions.js------------------------------------------------

my @functions;
foreach my $function (Perldoc::Function::list()) {
  my $description = Perldoc::Function::description($function) || warn "No description for $function";
  $description =~ s/\\/\\\\/g;
  $description =~ s/"/\\"/g;
  $description =~ s/C<(.*?)>/$1/g;
  $description =~ s/\n//sg;
  
  push @functions,{name=>$function, description=>$description};
}

$jsfile = catfile($Perldoc::Config::option{output_path},'static','indexFunctions.js');
$template->process('indexfunctions-js.tt',{%Perldoc::Config::option, functions=>\@functions},$jsfile) || die $template->error;


#--Create indexFAQs.js-----------------------------------------------------

my @faqs;
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
      push @faqs,{section=>$section,name=>$title};
    }
  }
}

$jsfile = catfile($Perldoc::Config::option{output_path},'static','indexFAQs.js');
$template->process('indexfaqs-js.tt',{%Perldoc::Config::option, faqs=>\@faqs},$jsfile) || die $template->error;


#--------------------------------------------------------------------------

sub optionspec {
  my %option_specs = @_;
  my @getopt_list;
  while (my ($option_name,$spec) = each %option_specs) {
    (my $variable_name = $option_name) =~ tr/-/_/;
    (my $nospace_name  = $option_name) =~ s/-//g;
    my $getopt_name = ($variable_name ne $option_name) ? "$variable_name|$option_name|$nospace_name" : $option_name;
    push @getopt_list,"$getopt_name$spec";
  }
  return @getopt_list;
}
