require 'json'

def sgn(n)
  n <=> 0
end


def convert_file(filename)
    f = File.open(filename)
    # header OE3D
    f.read(1).unpack('C').first.to_s(16)
    f.read(1).unpack('C').first.to_s(16)
    f.read(1).unpack('C').first.to_s(16)
    f.read(1).unpack('C').first.to_s(16)
    # version 
    f.read(1).unpack('C').first.to_s(16)
    # number of payloads --> 1
    f.read(1).unpack('C').first.to_s(16)
    
    #paper type --> N (SQUARE, Origmai.java)
    f.read(1).unpack('C').first.to_s(16)

    # 0 if paper type not custm
    f.read(1).unpack('C').first.to_s(16)

    # paper color -> 0x43 (C) + three values 
    f.read(1).unpack('C').first.to_s(16)
    f.read(1).unpack('C').first.to_s(16)
    f.read(1).unpack('C').first.to_s(16)
    f.read(1).unpack('C').first.to_s(16)

    #commands from here
    puts "start commands after #{f.pos} bytes"
    i = -1;
    commands = [];

   
    header = f.read(4).unpack("N*").shift;
    while(header != 0x0A454f46 && !f.eof)
        f.pos = f.pos - 4; # rewind last header read
        command_block = f.read(16);
        commands << parse_command(command_block)

        header = f.read(4).unpack("N*").shift;
    end

    puts "DONE"
    puts commands
    
    File.open("#{filename}_commands.json","w") do |f|
      f.write(commands.to_json)
    end

end

def convert_number(values)
    int = force_overflow_signed(values[0] << 8)+ values[1]
    frac =  (values[2]) + values[3]
    value = int + sgn(int) * frac.to_f/256/256
    
    value
end

# part of original scripts compression efforts
ORIGINS = [[0,0,0], [400,0,0], [0,400,0], [0,0,400]]

def force_overflow_signed(i)
  force_overflow_unsigned(i + 2**15) - 2**15
end

def force_overflow_unsigned(i)
  i % 2**16   # or equivalently: i & 0xffffffff
end

def parse_command(bytes)
    puts "\n\n ** processing command *** \n\n"
    puts "--- #{bytes.unpack("@0H8")} #{bytes.unpack("@4H8")} #{bytes.unpack("@8H8")} #{bytes.unpack("@12H8")} #{bytes.length}" 
    header = bytes.unpack("@0c4")
    header2 = bytes.unpack("@0H8").shift
    xbytes = bytes.unpack("@4C4")
    ybytes = bytes.unpack("@8C4")
    zbytes = bytes.unpack("@12C4")
    
    puts "header: #{header.to_s}"
    puts "xbytes: #{xbytes.to_s}"
    puts "ybytes: #{ybytes.to_s}"
    puts "zbytes: #{zbytes.to_s}"

    puts "processing"
    
    x = convert_number(xbytes)
    y = convert_number(ybytes)
    z = convert_number(zbytes)

    puts "x -- #{x}"
    puts "y -- #{y}"
    puts "z -- #{z}"

    origin_index = (header[0]%32 - header[0]%8)/8
    puts "origin_index #{origin_index}"
    ppoint = [
        x + ORIGINS[origin_index][0],
        y + ORIGINS[origin_index][1],
        z + ORIGINS[origin_index][2]
    ]
    pnormal = [x, y, z]

    puts "pnormal: #{pnormal}, ppoint: #{ppoint}"

    # choosing the appropriate half space
    if ( (header[0] - (header[0]%32))/32 == 1)
        pnormal = [ -pnormal[0], -pnormal[1], -pnormal[2]]
    end
        
    commandID = header[0]%8
    puts "commandID #{commandID}"
    # reflection fold
    if (commandID == 1)
        puts "FOLD_REFLECTION"
        return {
            "command" => "FOLD_REFLECTION",
            "ppoint" => ppoint,
            "pnormal" => pnormal
        }
    elsif (commandID == 2) # positive rotation fold
        phi = header[1]
        puts "POSITIVE FOLD_ROTATION #{phi}"
        return {
            "command" => "FOLD_ROTATION",
            "phi" => phi,
            "ppoint" => ppoint,
            "pnormal" => pnormal
        }
    elsif (commandID == 3) # negative rotation fold
        phi = -header[1]
        puts "NEGATIVE FOLD_ROTATION #{phi}"
        return {
            "command" => "FOLD_ROTATION",
            "phi" => phi,
            "ppoint" => ppoint,
            "pnormal" => pnormal
        }
    elsif (commandID == 4) # partial reflection fold
        polygonIndex = header[3];
        puts "FOLD_REFLECTION_P index => #{polygonIndex}"

        return {
            "command" => "FOLD_REFLECTION_P",
            "polygonIndex" => polygonIndex,
            "ppoint" => ppoint,
            "pnormal" => pnormal
        }
    elsif (commandID == 5) # positive partial rot. fold
        phi = header[1]
        polygonIndex = header[3];
        puts "POSITIVE FOLD_ROTATION_P phi => #{phi}, index => #{polygonIndex}"
        return {
            "command" => "FOLD_ROTATION_P",
            "phi" => phi,
            "polygonIndex" => polygonIndex,
            "ppoint" => ppoint,
            "pnormal" => pnormal
        }
    elsif (commandID == 6) # negative partial rot. fold
        phi = -header[1]
        polygonIndex = header[3];
        puts "NEGATIVE FOLD_ROTATION_P phi: #{phi}, index: #{polygonIndex}"

        return {
            "command" => "FOLD_ROTATION_P",
            "phi" => phi,
            "polygonIndex" => polygonIndex,
            "ppoint" => ppoint,
            "pnormal" => pnormal
        }
    elsif (commandID == 7) # crease
        puts "FOLD_CREASE"
        return {
            "command" => "FOLD_CREASE",
            "ppoint" => ppoint,
            "pnormal" => pnormal
        }
    elsif (commandID == 8) # cut
        puts "FOLD_MUTILATION"

        return {
            "command" => "FOLD_MUTILATION",
            "ppoint" => ppoint,
            "pnormal" => pnormal
        }
    else # partial cut
        puts "FOLD_MUTILATION_P"
        polygonIndex = header[3];
        return {
            "command" => "FOLD_MUTILATION_P",
            "polygonIndex" => polygonIndex,
            "ppoint" => ppoint,
            "pnormal" => pnormal
        }
    end

end
#--- ["01000000"] ["00c80000"] ["00c80000"] ["00000000"] 16
#--- ["11000000"] ["008d55bf"] ["feab3676"] ["00000000"] 16
convert_file("bird.ori.decoded")
# puts 0xff & (400 >> 8) #--> 1
# puts 0xff & (400) #--> 144
# puts 0xff & (0xc8) #-->200
# puts 0xff & (0xfe) #-->254
# puts  (0xfe << 8)
# # same as
# puts (1 << 8) + 144