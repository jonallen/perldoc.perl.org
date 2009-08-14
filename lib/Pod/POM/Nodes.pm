#============================================================= -*-Perl-*-
#
# Pod::POM::Nodes
#
# DESCRIPTION
#   Module implementing specific nodes in a Pod::POM, subclassed from
#   Pod::POM::Node.
#
# AUTHOR
#   Andy Wardley   <abw@kfs.org>
#
# COPYRIGHT
#   Copyright (C) 2000, 2001 Andy Wardley.  All Rights Reserved.
#
#   This module is free software; you can redistribute it and/or
#   modify it under the same terms as Perl itself.
#
# REVISION
#   $Id: Nodes.pm 14 2009-03-13 08:19:40Z ford $
#
#========================================================================

package Pod::POM::Nodes;

require 5.004;
require Exporter;

use strict;
use Pod::POM::Node;
use vars qw( $VERSION $DEBUG $ERROR @EXPORT_OK @EXPORT_FAIL );
use base qw( Exporter );

$VERSION = sprintf("%d.%02d", q$Revision: 1.3 $ =~ /(\d+)\.(\d+)/);
$DEBUG   = 0 unless defined $DEBUG;


#------------------------------------------------------------------------
package Pod::POM::Node::Pod;
use base qw( Pod::POM::Node );
use vars qw( @ACCEPT $ERROR );

@ACCEPT = qw( head1 head2 head3 head4 over begin for text verbatim code );


#------------------------------------------------------------------------
package Pod::POM::Node::Head1;
use base qw( Pod::POM::Node );
use vars qw( %ATTRIBS @ACCEPT $ERROR );

%ATTRIBS =   ( title => undef );
@ACCEPT  = qw( head2 head3 head4 over begin for text verbatim code );

sub new {
    my ($class, $pom, $title) = @_;
    $title = $pom->parse_sequence($title)
	|| return $class->error($pom->error())
	    if length $title;
    $class->SUPER::new($pom, $title);
}


#------------------------------------------------------------------------
package Pod::POM::Node::Head2;
use base qw( Pod::POM::Node );
use vars qw( %ATTRIBS @ACCEPT $ERROR );

%ATTRIBS =   ( title => undef );
@ACCEPT  = qw( head3 head4 over begin for text verbatim code );

sub new {
    my ($class, $pom, $title) = @_;
    $title = $pom->parse_sequence($title)
	|| return $class->error($pom->error())
	    if length $title;
    $class->SUPER::new($pom, $title);
}


#------------------------------------------------------------------------
package Pod::POM::Node::Head3;
use base qw( Pod::POM::Node );
use vars qw( %ATTRIBS @ACCEPT $ERROR );

%ATTRIBS =   ( title => undef );
@ACCEPT  = qw( head4 over begin for text verbatim code );

sub new {
    my ($class, $pom, $title) = @_;
    $title = $pom->parse_sequence($title)
	|| return $class->error($pom->error())
	    if length $title;
    $class->SUPER::new($pom, $title);
}


#------------------------------------------------------------------------
package Pod::POM::Node::Head4;
use base qw( Pod::POM::Node );
use vars qw( %ATTRIBS @ACCEPT $ERROR );

%ATTRIBS =   ( title => undef );
@ACCEPT  = qw( over begin for text verbatim code );

sub new {
    my ($class, $pom, $title) = @_;
    $title = $pom->parse_sequence($title)
	|| return $class->error($pom->error())
	    if length $title;
    $class->SUPER::new($pom, $title);
}


#------------------------------------------------------------------------
package Pod::POM::Node::Over;
use base qw( Pod::POM::Node );
use vars qw( %ATTRIBS @ACCEPT $EXPECT $ERROR );

%ATTRIBS =   ( indent => 4 );
@ACCEPT  = qw( over item begin for text verbatim code );
$EXPECT  = 'back';


#------------------------------------------------------------------------
package Pod::POM::Node::Item;
use base qw( Pod::POM::Node );
use vars qw( %ATTRIBS @ACCEPT $ERROR );

%ATTRIBS =   ( title => '*' );
@ACCEPT  = qw( over begin for text verbatim code );

sub new {
    my ($class, $pom, $title) = @_;
    $title = $pom->parse_sequence($title)
	|| return $class->error($pom->error())
	    if length $title;
    $class->SUPER::new($pom, $title);
}


#------------------------------------------------------------------------
package Pod::POM::Node::Begin;
use base qw( Pod::POM::Node );
use vars qw( %ATTRIBS @ACCEPT $EXPECT $ERROR );

%ATTRIBS =   ( format => undef );
@ACCEPT  = qw( text verbatim code );
$EXPECT  = 'end';


#------------------------------------------------------------------------
package Pod::POM::Node::For;
use base qw( Pod::POM::Node );
use vars qw( %ATTRIBS $ERROR );

%ATTRIBS = ( format => undef, text => '' );

sub new {
    my $class = shift;
    my $pom   = shift;
    my $text  = shift;
    $class->SUPER::new($pom, split(/\s+/, $text, 2));
}


#------------------------------------------------------------------------
package Pod::POM::Node::Verbatim;
use base qw( Pod::POM::Node );
use vars qw( %ATTRIBS $ERROR );

%ATTRIBS = ( text => '' );

sub present {
    my ($self, $view) = @_;
    $view ||= $Pod::POM::DEFAULT_VIEW;
    $view->view_verbatim($self->{ text });
}


#------------------------------------------------------------------------
package Pod::POM::Node::Code;
use base qw( Pod::POM::Node );
use vars qw( %ATTRIBS $ERROR );

%ATTRIBS = ( text => '' );

sub present {
    my ($self, $view) = @_;
    $view ||= $Pod::POM::DEFAULT_VIEW;
    $view->view_code($self->{ text });
}


#------------------------------------------------------------------------
package Pod::POM::Node::Text;
use Pod::POM::Constants qw( :all );
use base qw( Pod::POM::Node );
use vars qw( %ATTRIBS $ERROR );

%ATTRIBS = ( text => '' );

sub new {
    my $class = shift;
    my $pom   = shift;
    my $text  = shift;
    $text = $pom->parse_sequence($text)
        || return $class->error($pom->error())
            if length $text && ! $pom->{in_begin};
    $class->SUPER::new($pom, $text);
}

sub add {
    return IGNORE;
}

sub present {
    my ($self, $view) = @_;
    my $text = $self->{ text };
    $view ||= $Pod::POM::DEFAULT_VIEW;

    $text = $text->present($view) 
	if ref $text;

    $view->view_textblock($text);
}


#------------------------------------------------------------------------
package Pod::POM::Node::Sequence;

use Pod::POM::Constants qw( :all );
use base qw( Pod::POM::Node );
use vars qw( %NAME );

%NAME = (
    C => 'code',
    B => 'bold',
    I => 'italic',
    L => 'link',
    S => 'space',
    F => 'file',
    X => 'index',
    Z => 'zero',
    E => 'entity',
);
    
sub new {
    my ($class, $self) = @_;
    local $" = '] [';
    bless \$self, $class;
}

sub add {
    return IGNORE;
}

sub present {
    my ($self, $view) = @_;
    my ($cmd, $method, $result);
    $view ||= $Pod::POM::DEFAULT_VIEW;

    $self = $$self;
    return $self unless ref $self eq 'ARRAY';

    my $text = join('', 
                    map { ref $_ ? $_->present($view) 
                                 : $view->view_seq_text($_) } 
                    @{ $self->[CONTENT] });
    
    if ($cmd = $self->[CMD]) {
        my $method = $NAME{ $cmd } || $cmd;
        $method = "view_seq_$method";
        return $view->$method($text);
    }
    else {
        return $text;
    }
}


#------------------------------------------------------------------------
package Pod::POM::Node::Content;

use Pod::POM::Constants qw( :all );
use base qw( Pod::POM::Node );

sub new {
    my $class = shift;
    bless [ @_ ], $class;
}

sub present {
    my ($self, $view) = @_;
    $view ||= $Pod::POM::DEFAULT_VIEW;
    return join('', map { ref $_ ? $_->present($view) : $_ } @$self);
}


1;

