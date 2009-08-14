package Perldoc::Syntax;

use Data::Dumper;
use Perl::Tidy;
use Perldoc::Function;
use Storable qw/nstore retrieve/;
use FindBin qw/$Bin/;

our %cache;


BEGIN {
  our $cachefile = "$Bin/syntax.cache";
  if (-e $cachefile) {
    if (my $cacheref = retrieve($cachefile)) {
      %cache = %$cacheref;
    }
    #print Dumper(\%cache);
  }
}

END {
  #print Dumper(\%cache);
#  warn "Trying to store cache to $cachefile\n";
  nstore(\%cache,$cachefile) or die "Can't store cache file: $!\n";
}  

#tie my %cache => 'Memoize::Storable',"$Bin/syntax.cache",'nstore';
#memoize('_highlight',SCALAR_CACHE => [HASH => \%cache],
#                     LIST_CACHE   => 'MERGE',
#                     INSTALL      => 'highlight2');
                     
sub highlight {
  unless (defined $cache{join "\034",@_}) {
    $cache{join "\034",@_} = _highlight(@_);
  }
  
  my $result = $cache{join "\034",@_};
  
  if ($result =~ m!^<pre class="verbatim">!) {
    $result =~ s!^<pre class="verbatim">!!;
    $result =~ s!</pre>$!!;
    my $output = '<pre class="verbatim"><ol>';
    my @lines = split(/\r\n|\n/,$result);
    #if (@lines > 1) {
      foreach (@lines) {
        $output .= "<li>$_</li>";
      }
      $output .= '</ol></pre>';
      return $output;
    #} else {
    #  return qq{<pre class="verbatim">$result</pre>};
    #}
  } else {
    return $result;
  }
}                     
  
sub _highlight {
  my ($start,$end,$txt,$linkpath) = @_;
  if ($txt !~ /\s/) {
    if ($txt =~ /^(-?\w+)/i) {
      my $function = $1;
      if (Perldoc::Function::exists($function)) {
        return qq($start<a class="l_k" href=").$linkpath.qq(functions/$function.html">$txt</a>$end);
      }
    }
    if ($core_modules{$txt}) {
      return qq($start<a class="l_w" href="$linkpath$core_modules{$txt}">$txt</a>$end);
    }
  }
  
  my $original_text = $txt; 
  #$txt =~ s/<.*?>//gs;
  #$txt =~ s/&lt;/</gs;
  #$txt =~ s/&gt;/>/gs;
  #$txt =~ s/&amp;/&/gs;
  
  my @perltidy_argv = qw/-html -pre/;
  my $result;
  my $perltidy_error;
  my $stderr;
  perltidy( source=>\$txt, destination=>\$result, argv=>\@perltidy_argv, errorfile=>\$perltidy_error, stderr=>'std.err' );

  unless ($perltidy_error) {
    $result =~ s!<pre>\n*!$start!;
    $result =~ s!\n*</pre>!$end!;
    $result =~ s|(http://[-a-z0-9~/\.+_?=\@:%]+(?!\.\s))|<a href="$1">$1</a>|gim;
    $result =~ s!<span class="k">(.*?)</span>!(Perldoc::Function::exists($1))?q(<a class="l_k" href=").$linkpath.qq(functions/$1.html">$1</a>):$1!sge;
    $txt =~ s!<span class="w">(.*?)</span>!($core_modules{$1})?qq(<a class="l_w" href="$linkpath$core_modules{$1}">$1</a>):$1!sge;
    return $result;
  } else {
    $original_text =~ s/&/&amp;/sg;
    $original_text =~ s/</&lt;/sg;
    $original_text =~ s/>/&gt;/sg;
    return "$start$original_text$end";
  }
}

1;
