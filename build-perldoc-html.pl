#! /usr/bin/perl

use strict;
use warnings;
use Config;
use Data::Dumper;
use File::Basename;
use File::Path;
use File::Spec::Functions;
use FindBin qw/$Bin/;
use Getopt::Long;
use Template;

use lib "$Bin/lib";
use Perldoc::Config;


use constant TRUE  => 1;
use constant FALSE => 0;

use vars qw/$processing_state/;
use vars qw/%manpage_pods/;
use vars qw/%core_modules/;


#--Set options for Template::Toolkit---------------------------------------

use constant TT_INCLUDE_PATH => "$Bin/templates";


#--Set config options------------------------------------------------------

my %specifiers = (
  'output-path' => '=s',
  'download'    => '!',
  'pdf'         => '!',
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

%Perldoc::Config::option = (%Perldoc::Config::option, %options);


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
use Perldoc::Convert::html;
use Perldoc::Function;
use Perldoc::Function::Category;
use Perldoc::Page;
use Perldoc::Page::Convert;
use Perldoc::Section;  
EOT


#--Compute link addresses for core modules & pragmas-----------------------

foreach my $module (grep {/^[A-Z]/ && exists($Perldoc::Page::CoreList{$_})} Perldoc::Page::list()) {
  my $link = $module;
  $link =~ s!::!/!g;
  $link .= '.html';
  $core_modules{$module} = $link;
}

foreach my $section (Perldoc::Section::list()) {
  next unless $section eq 'pragmas';
  foreach my $pragma (Perldoc::Section::pages($section)) {
    my $link = $pragma;
    $link =~ s!::!/!g;
    $link .= '.html';
    $core_modules{$pragma} = $link;
  }
}

my @module_az_links;
foreach my $module_index ('A'..'Z') {
  my $link;
  if (grep {/^$module_index/ && exists($Perldoc::Page::CoreList{$_})} Perldoc::Page::list()) {
    $link = "index-modules-$module_index.html";
  } 
  push @module_az_links, {letter=>$module_index, link=>$link};
}


#--Set update timestamp----------------------------------------------------

my $date         = sprintf("%02d",(localtime(time))[3]);
my $month        = qw/ January
                       February
                       March
                       April
                       May
                       June
                       July
                       August
                       September
                       October
                       November
                       December /[(localtime(time))[4]];
my $year         = (localtime(time))[5] + 1900;

$Perldoc::Config::option{last_update} = "$date $month $year";


#--Create index pages------------------------------------------------------

foreach my $section (Perldoc::Section::list()) {
  my %index_data;
  my $template             = Template->new(INCLUDE_PATH => TT_INCLUDE_PATH);
  $index_data{pagedepth}   = 0;
  $index_data{path}        = '../' x $index_data{pagedepth};
  $index_data{pagename}    = Perldoc::Section::name($section);
  $index_data{pageaddress} = "index-$section.html";
  $index_data{content_tt}  = 'section_index.tt';
  $index_data{module_az}   = \@module_az_links;
  
  foreach my $page (Perldoc::Section::pages($section)) {
    (my $page_link = $page) =~ s/::/\//g;
    push @{$index_data{section_pages}},{name=>$page, link=>"$page_link.html",title=>Perldoc::Page::title($page)};
  }

  my $htmlfile = catfile($Perldoc::Config::option{output_path},$index_data{pageaddress});
  check_filepath($htmlfile);
  
  $template->process('default.tt',{%Perldoc::Config::option, %index_data},$htmlfile) || die $template->error;
  
  # For every index page, create the corresponding man pages
  foreach my $page (Perldoc::Section::pages($section)) {
    next if ($page eq 'perlfunc');  # 'perlfunc' will be created later
    my %page_data;
    (my $page_link = $page) =~ s/::/\//g;
    $page_data{pagedepth}   = 0 + $page =~ s/::/::/g;
    $page_data{path}        = '../' x $page_data{pagedepth};
    $page_data{pagename}    = $page;
    $page_data{pageaddress} = "$page_link.html";
    $page_data{contentpage} = 1;
    $page_data{module_az}   = \@module_az_links;
    $page_data{breadcrumbs} = [ {name=>Perldoc::Section::name($section), url=>"index-$section.html"} ];
    $page_data{content_tt}  = 'page.tt';
    $page_data{pdf_link}    = "$page_link.pdf";
    $page_data{pod_html}    = Perldoc::Page::Convert::html($page);
    $page_data{pod_html}    =~ s!<(pre class="verbatim")>(.+?)<(/pre)>!autolink($1,$2,$3,$page_data{path})!sge if ($page eq 'perl');
    $page_data{page_index}  = Perldoc::Page::Convert::index($page);

    my $filename  = catfile($Perldoc::Config::option{output_path},$page_data{pageaddress});    
    check_filepath($filename);
    
    $template->process('default.tt',{%Perldoc::Config::option, %page_data},$filename) || die "Failed processing $page\n".$template->error;
  }  
}


#--------------------------------------------------------------------------
#--Perl core modules-------------------------------------------------------
#--------------------------------------------------------------------------

foreach my $module_index ('A'..'Z') {
  my %page_data;
  my $template            = Template->new(INCLUDE_PATH => TT_INCLUDE_PATH);
  $page_data{pagedepth}   = 0;
  $page_data{path}        = '../' x $page_data{pagedepth};
  $page_data{pagename}    = qq{Core modules ($module_index)};
  $page_data{pageaddress} = "index-modules-$module_index.html";
  $page_data{breadcrumbs} = [ ];
  $page_data{content_tt}  = 'module_index.tt';
  $page_data{module_az}   = \@module_az_links;
  
  foreach my $module (grep {/^$module_index/ && exists($Perldoc::Page::CoreList{$_})} sort {uc $a cmp uc $b} Perldoc::Page::list()) {
    (my $module_link = $module) =~ s/::/\//g;
    $module_link .= '.html';
    push @{$page_data{module_links}}, {name=>$module, title=>Perldoc::Page::title($module), url=>$module_link};
  }
  
  my $filename = catfile($Perldoc::Config::option{output_path},$page_data{pageaddress});
  check_filepath($filename);
  
  $template->process('default.tt',{%Perldoc::Config::option, %page_data},$filename) || die $template->error;
  
  foreach my $module (grep {/^$module_index/ && exists($Perldoc::Page::CoreList{$_})} Perldoc::Page::list()) {
    my %module_data;
    (my $module_link = $module) =~ s/::/\//g;
    $module_data{pageaddress} = "$module_link.html";
    $module_data{contentpage} = 1;
    $module_data{pagename}    = $module;
    $module_data{pagedepth}   = 0 + $module =~ s/::/::/g;
    $module_data{path}        = '../' x $module_data{pagedepth};
    $module_data{breadcrumbs} = [ 
                                  {name=>"Core modules ($module_index)", url=>"index-modules-$module_index.html"} ];
    $module_data{content_tt}  = 'page.tt';
    $module_data{pdf_link}    = "$module_link.pdf";
    $module_data{module_az}   = \@module_az_links;
    $module_data{pod_html}    = Perldoc::Page::Convert::html($module);
    $module_data{page_index}  = Perldoc::Page::Convert::index($module);
                                
    my $filename = catfile($Perldoc::Config::option{output_path},$module_data{pageaddress});
    check_filepath($filename);
    
    $template->process('default.tt',{%Perldoc::Config::option, %module_data},$filename) || die "Failed processing $module\n".$template->error;
  }
}


#--------------------------------------------------------------------------
#--Perl glossary-----------------------------------------------------------
#--------------------------------------------------------------------------

# Not implemented yet :-(


#--------------------------------------------------------------------------
#--Perl functions----------------------------------------------------------
#--------------------------------------------------------------------------

#--Generic variables-------------------------------------------------------

my %function_data;
my $function_template = Template->new(INCLUDE_PATH => TT_INCLUDE_PATH);


#--Index variables---------------------------------------------------------

$function_data{pagedepth}   = 0;
$function_data{path}        = '../' x $function_data{pagedepth};


#--Create A-Z index page---------------------------------------------------

$function_data{pageaddress} = 'index-functions.html';
$function_data{pagename}    = 'Perl functions A-Z';
$function_data{breadcrumbs} = [ {name=>'Language reference', url=>'index-language.html'} ];
$function_data{content_tt}  = 'function_index.tt';
$function_data{module_az}   = \@module_az_links;

foreach my $letter ('A'..'Z') {
  my ($link,@functions);
  if (my @function_list = grep {/^[^a-z]*$letter/i} sort (Perldoc::Function::list())) {
    $link = "#$letter";
    foreach my $function (@function_list) {
      (my $url = $function) =~ s/[^\w-].*//i;
      $url .= '.html';
      my $description = Perldoc::Function::description($function);
      push @functions,{name=>$function, url=>$url, description=>$description};
    }
  } 
  push @{$function_data{function_az}}, {letter=>$letter, link=>$link, functions=>\@functions};
}

my $filename = catfile($Perldoc::Config::option{output_path},$function_data{pageaddress});
check_filepath($filename);

$function_template->process('default.tt',{%Perldoc::Config::option, %function_data},$filename) || die "Failed processing function A-Z\n".$function_template->error;


#--Create 'functions by category' index page-------------------------------

$function_data{pageaddress} = 'index-functions-by-cat.html';
$function_data{pagename}    = 'Perl functions by category';
$function_data{content_tt}  = 'function_bycat.tt';

foreach my $category (Perldoc::Function::Category::list()) {
  my $name = Perldoc::Function::Category::description($category);
  (my $link = $name) =~ tr/ /-/;
  my @functions;
  foreach my $function (sort (Perldoc::Function::Category::functions($category))) {
    (my $url = $function) =~ s/[^\w-].*//i;
    $url .= '.html';
    my $description = Perldoc::Function::description($function);
    push @functions,{name=>$function, url=>$url, description=>$description};
  }
  push @{$function_data{function_cat}},{name=>$name, link=>$link, functions=>\@functions};
}

$filename = catfile($Perldoc::Config::option{output_path},$function_data{pageaddress});
check_filepath($filename);

$function_template->process('default.tt',{%Perldoc::Config::option, %function_data},$filename) || die "Failed processing functions by category\n".$function_template->error;


#--Create 'perlfunc' page--------------------------------------------------

$function_data{pageaddress} = 'perlfunc.html';
$function_data{contentpage} = 1;
$function_data{pagename}    = 'perlfunc';
$function_data{content_tt}  = 'function_page.tt';
$function_data{pdf_link}    = "perlfunc.pdf";
$function_data{pod_html}    = Perldoc::Page::Convert::html('perlfunc');
    
$filename = catfile($Perldoc::Config::option{output_path},$function_data{pageaddress});
check_filepath($filename);

$function_template->process('default.tt',{%Perldoc::Config::option, %function_data},$filename) || die "Failed processing perlfunc\n".$function_template->error;


#--Function variables------------------------------------------------------

undef $function_data{pdf_link};
$function_data{pagedepth}   = 1;
$function_data{path}        = '../' x $function_data{pagedepth};


#--Create individual function pages----------------------------------------

foreach my $function (Perldoc::Function::list()) {
  local $processing_state = 'functions';
  my $function_pod = Perldoc::Function::pod($function);
  $function =~ s/[^\w-].*//i;
  warn ("No Pod for function '$function'\n") unless ($function_pod);
  chomp $function_pod;
  
  $function_data{pageaddress} = "functions/$function.html";
  $function_data{pagename}    = $function;
  $function_data{breadcrumbs} = [ {name=>'Language reference', url=>'index-language.html'},
                                  {name=>'Functions', url=>'index-functions.html'} ];
  $function_data{pod_html}    = Perldoc::Convert::html::convert('function::',$function_pod);
  $function_data{pod_html} =~ s!(<a href=")#(\w+)(">)!Perldoc::Function::exists($2) ? "$1../functions/$2.html$3" : "$1#$2$3"!ge;

  $filename  = catfile($Perldoc::Config::option{output_path},$function_data{pageaddress});
  check_filepath($filename);
  
  $function_template->process('default.tt',{%Perldoc::Config::option, %function_data},$filename) || die "Failed processing perlfunc\n".$function_template->error;
}


#--------------------------------------------------------------------------

sub autolink {
  my ($start,$txt,$end,$linkpath) = @_;
  $txt =~ s!\b(perl\w+)\b!(Perldoc::Page::exists($1))?qq(<a href="$linkpath$1.html">$1</a>):$1!sge;
  return "<$start>$txt<$end>";
}


sub check_filepath {
  my $filename  = shift;
  my $directory = dirname($filename);
  mkpath $directory unless (-d $directory);
}

sub escape {
  my $data = shift;
  $data =~ s/([^a-z0-9])/sprintf("%%%02x",ord($1))/egi;
  return $data;
}

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

