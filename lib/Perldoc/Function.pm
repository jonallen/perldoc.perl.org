package Perldoc::Function;

use strict;
use warnings;
use Perldoc::Page;
use Pod::Functions;

our $VERSION = '0.01';


#--------------------------------------------------------------------------

our %function_pod;
if (my $perlfunc = Perldoc::Page::pod('perlfunc')) {
  open PERLFUNC,'<',\$perlfunc;
  do {} until (<PERLFUNC> =~ /^=head2 Alphabetical Listing of Perl Functions/);
  my (@headers,$body,$inlist);
  my $state = 'header_search';
  SEARCH: while (<PERLFUNC>) {
    if ($state eq 'header_search') {
      next SEARCH unless (/^=item\s+\S/);
      $state = 'header_capture';
    }
    if ($state eq 'header_capture') {
      if (/^\s*$/) {
        next SEARCH;
      } elsif (/^=item\s+(\S.*)/) {
        push @headers,$_;
        #warn("Found $_");
      } else {
        $inlist = 0;
        $state  = 'body';
        $body   = '';
      }
    }
    if ($state eq 'body') {
      if (/^=over/) {
        ++$inlist;
      } elsif (/^=back/ and ($inlist > 0)) {
        --$inlist;
      } elsif (/^=item/ or /^=back/) {
        unless ($inlist) {
          my %unique_functions;
          foreach my $header (@headers) {
            $unique_functions{$1}++ if ($header =~ m/^=item\s+(-?\w+)/)
          }
          foreach my $function (keys %unique_functions) {
            #warn("Storing $function\n");
            #if ($header =~ /^=item\s+(\S\S+)/) {
              #my $function = $1;
              my $pod = "=over\n\n";
              $pod   .= join "\n",grep {/=item $function/} @headers;
              $pod   .= "\n$body=back\n\n";
              $function_pod{$function} .= $pod;
              #last;
	    #}
          }
          $state  = 'header_search';
          @headers = ();
          redo SEARCH;
        }
      } 
      $body .= $_;
    }
  }
  close PERLFUNC;
} 

foreach my $function (keys %Flavor) {
  if ($function =~ /^(-?\w+)\W/) {
    my $real_function = $1;
    $Flavor{$real_function} = $Flavor{$function};
  }
}


$Flavor{'say'}   = 'print with newline';
$Flavor{'state'} = 'declare and assign a state variable (persistent lexical scoping)';
$Flavor{'break'} = 'break out of a "given" block';


#--------------------------------------------------------------------------

sub list {
  #return keys %Flavor;
  return keys %function_pod;
}


#--------------------------------------------------------------------------

sub description {
  my $function = shift;
  return $Flavor{$function};
}


#--------------------------------------------------------------------------

sub pod {
  my $function = shift;
  return $function_pod{$function};
}


#--------------------------------------------------------------------------

sub exists {
  my $function = shift;
  return exists $function_pod{$function};
}


#--------------------------------------------------------------------------

1;
